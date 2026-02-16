const express = require("express");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { spawn, execFileSync } = require("child_process");

const app = express();
const PREFERRED_PORT = Number(process.env.PORT) || 4455;
const MAX_PORT_RETRIES = process.env.PORT ? 0 : 20;
const DOWNLOAD_DIR = path.join(__dirname, "downloads");
const RETENTION_MS = 6 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
const IS_WINDOWS = process.platform === "win32";
const ALLOW_ANY_URL = process.env.ALLOW_ANY_URL === "1";
const MAX_ACTIVE_JOBS = Number(process.env.MAX_ACTIVE_JOBS) > 0 ? Number(process.env.MAX_ACTIVE_JOBS) : 3;
const API_RATE_LIMIT_WINDOW_MS =
  Number(process.env.API_RATE_LIMIT_WINDOW_MS) > 0 ? Number(process.env.API_RATE_LIMIT_WINDOW_MS) : 60 * 1000;
const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX) > 0 ? Number(process.env.API_RATE_LIMIT_MAX) : 45;

const jobs = new Map();
const listeners = new Map();
const apiRateBuckets = new Map();

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function resolveBinary(envKey, localNames, fallbackCommand) {
  const envValue = process.env[envKey];
  if (envValue && envValue.trim()) {
    const raw = envValue.trim();
    const candidate = path.isAbsolute(raw) ? raw : path.join(__dirname, raw);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    return raw;
  }

  for (const name of localNames) {
    const candidate = path.join(__dirname, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return fallbackCommand;
}

function looksLikePath(command) {
  return path.isAbsolute(command) || command.includes("/") || command.includes("\\");
}

const YTDLP_BIN = resolveBinary("YTDLP_BIN", ["yt-dlp.exe", "yt-dlp"], IS_WINDOWS ? "yt-dlp.exe" : "yt-dlp");
const FFMPEG_BIN = resolveBinary("FFMPEG_BIN", ["ffmpeg.exe", "ffmpeg"], IS_WINDOWS ? "ffmpeg.exe" : "ffmpeg");
const FFMPEG_LOCATION_ARG =
  looksLikePath(FFMPEG_BIN) && fs.existsSync(FFMPEG_BIN) ? ["--ffmpeg-location", path.dirname(FFMPEG_BIN)] : [];
const COOKIES_FILE = path.join(__dirname, "cookies.txt");
const COOKIES_ARG = fs.existsSync(COOKIES_FILE) ? ["--cookies", COOKIES_FILE] : [];
const JS_RUNTIME_ARG = IS_WINDOWS ? [] : ["--js-runtimes", "node"];
const YT_EXTRACTOR_ARG = COOKIES_ARG.length > 0 ? [] : ["--extractor-args", "youtube:player_client=mweb"];

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/img", express.static(path.join(__dirname, "img")));

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function applyApiRateLimit(req, res, next) {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = apiRateBuckets.get(ip) || [];
  const recent = bucket.filter((ts) => now - ts < API_RATE_LIMIT_WINDOW_MS);

  if (recent.length >= API_RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
    return;
  }

  recent.push(now);
  apiRateBuckets.set(ip, recent);
  next();
}

app.use("/api", applyApiRateLimit);

function isAllowedMediaHost(hostname) {
  if (ALLOW_ANY_URL) {
    return true;
  }

  const host = String(hostname || "").toLowerCase();
  if (!host) {
    return false;
  }

  return (
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtu.be" ||
    host.endsWith(".youtu.be") ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube-nocookie.com")
  );
}

function toSafeUrl(rawUrl) {
  if (typeof rawUrl !== "string") {
    return null;
  }

  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!isAllowedMediaHost(parsed.hostname)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Unknown";
  }

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${m}:${String(s).padStart(2, "0")}`;
}

function pickThumbnail(info) {
  if (typeof info.thumbnail === "string" && info.thumbnail.length > 0) {
    return info.thumbnail;
  }

  if (Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
    return info.thumbnails[info.thumbnails.length - 1].url || null;
  }

  return null;
}

function asMegabytes(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function summarizeFormats(info) {
  const formats = Array.isArray(info.formats) ? info.formats : [];

  const video = formats
    .filter((f) => f && f.format_id && f.vcodec && f.vcodec !== "none")
    .map((f) => ({
      formatId: String(f.format_id),
      ext: f.ext || "unknown",
      height: Number.isFinite(f.height) ? f.height : null,
      fps: Number.isFinite(f.fps) ? f.fps : null,
      filesize: asMegabytes(f.filesize || f.filesize_approx),
      note: f.format_note || "",
      label: [
        f.format_id,
        f.ext,
        Number.isFinite(f.height) ? `${f.height}p` : null,
        Number.isFinite(f.fps) ? `${f.fps}fps` : null,
        asMegabytes(f.filesize || f.filesize_approx),
      ]
        .filter(Boolean)
        .join(" | "),
    }))
    .sort((a, b) => {
      const ah = a.height || 0;
      const bh = b.height || 0;
      if (bh !== ah) {
        return bh - ah;
      }
      return (b.fps || 0) - (a.fps || 0);
    })
    .slice(0, 20);

  const audio = formats
    .filter((f) => f && f.format_id && f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none"))
    .map((f) => ({
      formatId: String(f.format_id),
      ext: f.ext || "unknown",
      abr: Number.isFinite(f.abr) ? f.abr : null,
      filesize: asMegabytes(f.filesize || f.filesize_approx),
      note: f.format_note || "",
      label: [
        f.format_id,
        f.ext,
        Number.isFinite(f.abr) ? `${Math.round(f.abr)}kbps` : null,
        asMegabytes(f.filesize || f.filesize_approx),
      ]
        .filter(Boolean)
        .join(" | "),
    }))
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))
    .slice(0, 20);

  return { video, audio };
}

function sendSseEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastJob(jobId) {
  const set = listeners.get(jobId);
  if (!set || set.size === 0) {
    return;
  }

  const snapshot = jobs.get(jobId);
  if (!snapshot) {
    return;
  }

  for (const res of set) {
    sendSseEvent(res, "status", snapshot);
  }
}

function updateJob(jobId, patch) {
  const current = jobs.get(jobId);
  if (!current) {
    return;
  }

  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  jobs.set(jobId, next);
  broadcastJob(jobId);
}

function getActiveJobCount() {
  let active = 0;
  for (const job of jobs.values()) {
    if (
      job.status === "created" ||
      job.status === "queued" ||
      job.status === "downloading" ||
      job.status === "converting"
    ) {
      active += 1;
    }
  }
  return active;
}

async function runYtDlpJson(url) {
  return new Promise((resolve, reject) => {
    const args = ["-J", "--no-playlist", ...FFMPEG_LOCATION_ARG, ...COOKIES_ARG, ...JS_RUNTIME_ARG, ...YT_EXTRACTOR_ARG, url];
    const child = spawn(YTDLP_BIN, args, { windowsHide: true });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error(`yt-dlp binary not found at "${YTDLP_BIN}". Make sure yt-dlp is installed and accessible.`));
      } else {
        reject(new Error(`Failed to execute yt-dlp: ${err.message}`));
      }
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        resolve(info);
      } catch {
        reject(new Error("Could not parse yt-dlp metadata JSON output."));
      }
    });
  });
}

function getVideoFormatSelector(quality, selectedFormatId) {
  if (quality === "custom" && selectedFormatId) {
    return `${selectedFormatId}+bestaudio/${selectedFormatId}/best`;
  }

  const dynamicHeight = String(quality || "").match(/^h(\d{2,4})$/);
  if (dynamicHeight) {
    const h = Number(dynamicHeight[1]);
    return `bestvideo*[height<=${h}]+bestaudio/best[height<=${h}]`;
  }

  const map = {
    best: "bestvideo*+bestaudio/best",
    "1080": "bestvideo*[height<=1080]+bestaudio/best[height<=1080]",
    "720": "bestvideo*[height<=720]+bestaudio/best[height<=720]",
    "480": "bestvideo*[height<=480]+bestaudio/best[height<=480]",
    worst: "worstvideo*+worstaudio/worst",
  };

  return map[quality] || map.best;
}

function getAudioQualityValue(quality) {
  const map = {
    best: "0",
    high: "3",
    medium: "5",
    low: "7",
  };
  return map[quality] || map.best;
}

function getAudioFormatSelector(quality, selectedFormatId) {
  if (quality === "custom" && selectedFormatId) {
    return selectedFormatId;
  }

  const dynamicBitrate = String(quality || "").match(/^a(\d{2,3})$/);
  if (dynamicBitrate) {
    const abr = Number(dynamicBitrate[1]);
    return `bestaudio[abr<=${abr}]/bestaudio/best`;
  }

  return "bestaudio/best";
}

async function findDownloadedFile(jobId) {
  const entries = await fsp.readdir(DOWNLOAD_DIR, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => {
      if (!entry.isFile() || !entry.name.startsWith(`${jobId}__`)) return false;
      const lower = entry.name.toLowerCase();
      if (lower.endsWith(".part") || lower.endsWith(".ytdl") || lower.includes(".temp.") || lower.includes(".f") && lower.includes(".part")) return false;
      return true;
    })
    .map((entry) => entry.name);

  if (candidates.length === 0) {
    return null;
  }

  const withStats = await Promise.all(
    candidates.map(async (name) => {
      const fullPath = path.join(DOWNLOAD_DIR, name);
      const stat = await fsp.stat(fullPath);
      return { name, fullPath, mtimeMs: stat.mtimeMs, size: stat.size };
    })
  );

  // Filter out empty/tiny files, sort by size descending
  const valid = withStats.filter((f) => f.size > 1024);
  if (valid.length === 0) return withStats.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  valid.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return valid[0];
}

function startDownloadJob(jobId, { url, mode, format, quality, selectedFormatId }) {
  const outputTemplate = path.join(DOWNLOAD_DIR, `${jobId}__%(title).120B.%(ext)s`);
  const baseArgs = [...FFMPEG_LOCATION_ARG, ...COOKIES_ARG, ...JS_RUNTIME_ARG, ...YT_EXTRACTOR_ARG];
  const args = [
    "--no-playlist", "--newline", "--restrict-filenames",
    "--concurrent-fragments", "4",
    "--buffer-size", "16K",
    "--http-chunk-size", "10M",
    ...baseArgs, "-o", outputTemplate,
  ];

  if (mode === "audio") {
    args.push("-f", getAudioFormatSelector(quality, selectedFormatId));
    args.push("-x", "--audio-format", format || "mp3", "--audio-quality", getAudioQualityValue(quality));
  } else {
    args.push("-f", getVideoFormatSelector(quality, selectedFormatId));
    args.push("--merge-output-format", format || "mp4");
  }

  args.push(url);

  const child = spawn(YTDLP_BIN, args, { windowsHide: true });

  updateJob(jobId, {
    status: "queued",
    message: "Job queued on server.",
    percent: 0,
  });

  const processLine = (line) => {
    if (!line || !line.trim()) {
      return;
    }

    const text = line.trim();
    let patch = null;

    const progressMatch = text.match(/(\d+(?:\.\d+)?)%/);
    if (text.includes("[download]") && progressMatch) {
      patch = {
        status: "downloading",
        percent: Number(progressMatch[1]),
        message: `Downloading to server: ${progressMatch[1]}%`,
        logLine: text,
      };
    } else if (text.includes("[download]")) {
      patch = {
        status: "downloading",
        message: "Downloading to server...",
        logLine: text,
      };
    } else if (
      text.includes("[ExtractAudio]") ||
      text.includes("[Merger]") ||
      text.includes("[VideoConvertor]") ||
      text.includes("[Fixup]") ||
      text.includes("[MoveFiles]") ||
      text.includes("[ModifyChapters]") ||
      text.includes("[EmbedThumbnail]") ||
      text.toLowerCase().includes("ffmpeg") ||
      text.includes("Deleting original file")
    ) {
      patch = {
        status: "converting",
        percent: 99,
        message: "Converting/merging media...",
        logLine: text,
      };
    } else {
      patch = {
        logLine: text,
      };
    }

    updateJob(jobId, patch);
  };

  child.stdout.on("data", (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const line of lines) {
      processLine(line);
    }
  });

  child.stderr.on("data", (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const line of lines) {
      processLine(line);
    }
  });

  child.on("error", (err) => {
    const detail = err.code === "ENOENT"
      ? `yt-dlp binary not found at "${YTDLP_BIN}". Is it installed?`
      : `Failed to start yt-dlp: ${err.message}`;
    updateJob(jobId, {
      status: "error",
      message: detail,
      error: detail,
    });
  });

  child.on("close", async (code) => {
    if (code !== 0) {
      const snapshot = jobs.get(jobId);
      updateJob(jobId, {
        status: "error",
        message: snapshot?.logLine || `yt-dlp failed with code ${code}`,
        error: snapshot?.logLine || `yt-dlp failed with code ${code}`,
      });
      return;
    }

    updateJob(jobId, {
      status: "converting",
      percent: 99,
      message: "Finalizing file...",
    });

    // Small delay to let filesystem flush
    await new Promise((r) => setTimeout(r, 800));

    try {
      const result = await findDownloadedFile(jobId);
      if (!result) {
        // Retry once more after a longer delay
        await new Promise((r) => setTimeout(r, 2000));
        const retry = await findDownloadedFile(jobId);
        if (!retry) {
          updateJob(jobId, {
            status: "error",
            message: "Download finished but no output file was found.",
            error: "Output file missing",
          });
          return;
        }
        const publicName = retry.name.replace(`${jobId}__`, "");
        updateJob(jobId, {
          status: "done",
          percent: 100,
          message: "Completed. File is ready.",
          fileName: publicName,
          filePath: retry.fullPath,
          downloadUrl: `/api/file/${jobId}`,
          expiresAt: new Date(Date.now() + RETENTION_MS).toISOString(),
        });
        return;
      }

      const publicName = result.name.replace(`${jobId}__`, "");
      updateJob(jobId, {
        status: "done",
        percent: 100,
        message: "Completed. File is ready.",
        fileName: publicName,
        filePath: result.fullPath,
        downloadUrl: `/api/file/${jobId}`,
        expiresAt: new Date(Date.now() + RETENTION_MS).toISOString(),
      });
    } catch (err) {
      updateJob(jobId, {
        status: "error",
        message: `Completed but failed to index file: ${err.message}`,
        error: err.message,
      });
    }
  });
}

async function cleanupDownloads() {
  const now = Date.now();

  try {
    const entries = await fsp.readdir(DOWNLOAD_DIR, { withFileTypes: true });

    await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const fullPath = path.join(DOWNLOAD_DIR, entry.name);
          const stat = await fsp.stat(fullPath);
          const age = now - stat.mtimeMs;

          if (age > RETENTION_MS) {
            await fsp.unlink(fullPath);
          }
        })
    );
  } catch (err) {
    console.error("cleanup failed:", err.message);
  }

  for (const [jobId, job] of jobs.entries()) {
    if ((job.status === "done" || job.status === "error") && now - new Date(job.updatedAt).getTime() > RETENTION_MS) {
      jobs.delete(jobId);
      listeners.delete(jobId);
    }
  }
}

setInterval(cleanupDownloads, CLEANUP_INTERVAL_MS);
cleanupDownloads().catch(() => undefined);

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/api/info", async (req, res) => {
  const url = toSafeUrl(req.body?.url);
  if (!url) {
    res.status(400).json({ error: "Please provide a valid YouTube URL." });
    return;
  }

  try {
    const info = await runYtDlpJson(url);
    const { video, audio } = summarizeFormats(info);

    res.json({
      title: info.title || "Unknown title",
      uploader: info.uploader || info.channel || "Unknown uploader",
      duration: formatDuration(info.duration),
      thumbnail: pickThumbnail(info),
      webpageUrl: info.webpage_url || url,
      videoFormats: video,
      audioFormats: audio,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not fetch media metadata." });
  }
});

app.post("/api/download", (req, res) => {
  const url = toSafeUrl(req.body?.url);
  const mode = req.body?.mode === "audio" ? "audio" : "video";
  const format = typeof req.body?.format === "string" ? req.body.format.trim().toLowerCase() : "";
  const quality = typeof req.body?.quality === "string" ? req.body.quality.trim().toLowerCase() : "best";
  const selectedFormatId =
    typeof req.body?.selectedFormatId === "string" && req.body.selectedFormatId.trim().length > 0
      ? req.body.selectedFormatId.trim()
      : "";

  if (!url) {
    res.status(400).json({ error: "Please provide a valid YouTube URL." });
    return;
  }

  const allowedVideoFormats = new Set(["mp4", "webm", "mkv"]);
  const allowedAudioFormats = new Set(["mp3", "m4a", "wav", "flac", "opus"]);

  if (mode === "video" && !allowedVideoFormats.has(format)) {
    res.status(400).json({ error: "Invalid video format selected." });
    return;
  }

  if (mode === "audio" && !allowedAudioFormats.has(format)) {
    res.status(400).json({ error: "Invalid audio format selected." });
    return;
  }

  if (getActiveJobCount() >= MAX_ACTIVE_JOBS) {
    res.status(429).json({ error: `Server is busy. Try again in a minute. Max active jobs: ${MAX_ACTIVE_JOBS}.` });
    return;
  }

  const jobId = randomUUID();
  jobs.set(jobId, {
    jobId,
    status: "created",
    message: "Job created.",
    percent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    format,
    quality,
    selectedFormatId,
    filePath: null,
    fileName: null,
    downloadUrl: null,
    expiresAt: null,
    logLine: null,
    error: null,
  });

  startDownloadJob(jobId, {
    url,
    mode,
    format,
    quality,
    selectedFormatId,
  });

  res.json({
    jobId,
    eventsUrl: `/api/events/${jobId}`,
    statusUrl: `/api/job/${jobId}`,
  });
});

app.get("/api/events/:jobId", (req, res) => {
  const jobId = req.params.jobId;
  const job = jobs.get(jobId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!job) {
    sendSseEvent(res, "status", { status: "error", message: "Job not found." });
    res.end();
    return;
  }

  sendSseEvent(res, "status", job);

  const set = listeners.get(jobId) || new Set();
  set.add(res);
  listeners.set(jobId, set);

  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAlive);
    const current = listeners.get(jobId);
    if (!current) {
      return;
    }
    current.delete(res);
    if (current.size === 0) {
      listeners.delete(jobId);
    }
  });
});

app.get("/api/job/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  res.json(job);
});

app.get("/api/file/:jobId", async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.status !== "done" || !job.filePath) {
    res.status(404).json({ error: "File is not available." });
    return;
  }

  try {
    await fsp.access(job.filePath, fs.constants.F_OK);
  } catch {
    res.status(410).json({ error: "File expired or removed." });
    return;
  }

  res.download(job.filePath, job.fileName || path.basename(job.filePath));
});

function startServer(port, attempt = 0) {
  const server = app.listen(port, () => {
    console.log(`RobinDown server running at http://localhost:${port}`);
    console.log(`yt-dlp binary: ${YTDLP_BIN}`);
    console.log(`ffmpeg binary: ${FFMPEG_BIN}`);
    console.log(`allow any URL: ${ALLOW_ANY_URL}`);
    console.log(`max active jobs: ${MAX_ACTIVE_JOBS}`);
    console.log(`api rate limit: ${API_RATE_LIMIT_MAX} req / ${API_RATE_LIMIT_WINDOW_MS} ms per IP`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && attempt < MAX_PORT_RETRIES) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy. Trying ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }

    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the existing process or set PORT to another port.`);
    } else {
      console.error(`Server failed to start: ${err.message}`);
    }
    process.exit(1);
  });
}

function checkBinary(label, bin) {
  try {
    const versionFlag = label === "ffmpeg" ? "-version" : "--version";
    const out = execFileSync(bin, [versionFlag], { timeout: 10000, windowsHide: true }).toString().split("\n")[0].trim();
    console.log(`[startup] ${label}: ${out}`);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.warn(`[startup] WARNING: ${label} not found at "${bin}". Download/conversion will fail.`);
    } else {
      console.warn(`[startup] WARNING: ${label} check failed: ${err.message}`);
    }
    return false;
  }
}

checkBinary("yt-dlp", YTDLP_BIN);
checkBinary("ffmpeg", FFMPEG_BIN);
console.log(`[startup] cookies: ${COOKIES_ARG.length > 0 ? COOKIES_FILE : "not found (optional)"}`);
console.log(`[startup] extractor args: ${YT_EXTRACTOR_ARG.length > 0 ? YT_EXTRACTOR_ARG.join(" ") : "default (using cookies)"}`);
startServer(PREFERRED_PORT);
