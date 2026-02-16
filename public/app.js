const els = {
  urlInput: document.getElementById("urlInput"),
  fetchBtn: document.getElementById("fetchBtn"),
  globalMessage: document.getElementById("globalMessage"),
  metaPanel: document.getElementById("metaPanel"),
  thumb: document.getElementById("thumb"),
  title: document.getElementById("title"),
  uploader: document.getElementById("uploader"),
  duration: document.getElementById("duration"),
  optionsPanel: document.getElementById("optionsPanel"),
  availabilityPanel: document.getElementById("availabilityPanel"),
  modeSelect: document.getElementById("modeSelect"),
  formatSelect: document.getElementById("formatSelect"),
  qualitySelect: document.getElementById("qualitySelect"),
  formatIdWrap: document.getElementById("formatIdWrap"),
  formatIdSelect: document.getElementById("formatIdSelect"),
  videoQualityList: document.getElementById("videoQualityList"),
  audioQualityList: document.getElementById("audioQualityList"),
  downloadBtn: document.getElementById("downloadBtn"),
  statusPanel: document.getElementById("statusPanel"),
  statusText: document.getElementById("statusText"),
  progressBar: document.getElementById("progressBar"),
  logBox: document.getElementById("logBox"),
  fileMeta: document.getElementById("fileMeta"),
  downloadLink: document.getElementById("downloadLink"),
  langEnBtn: document.getElementById("langEnBtn"),
  langTrBtn: document.getElementById("langTrBtn"),
  currentYear: document.getElementById("currentYear"),
};

const I18N = {
  en: {
    app_title: "RobinDown",
    nav_downloader: "Downloader",
    nav_features: "Features",
    nav_faq: "FAQ",
    hero_tag: "yt-dlp powered",
    hero_title: "Fast YouTube Downloads, Cleaner Workflow",
    hero_subtitle:
      "Paste link, preview thumbnail and metadata, choose exact quality, then track live server download and conversion.",
    hero_action_start: "Start Downloading",
    hero_action_features: "View Features",
    downloader_title: "Downloader Workspace",
    downloader_subtitle: "Everything below is live and connected to your server-side yt-dlp engine.",
    label_video_url: "Video URL",
    placeholder_url: "https://www.youtube.com/watch?v=...",
    btn_preview: "Preview",
    label_type: "Type",
    mode_video: "Video",
    mode_audio: "Audio",
    label_output_format: "Output format",
    label_quality: "Quality",
    label_source_format: "Specific source format (optional/custom)",
    btn_download: "Download",
    available_qualities: "Available Qualities",
    status_title: "Status",
    btn_download_file: "Download File",
    features_title: "What You Get",
    features_subtitle: "Built for clear control, transparent progress, and clean server lifecycle.",
    feature_1_title: "Exact format control",
    feature_1_text: "Choose video/audio output format and exact available source qualities from yt-dlp metadata.",
    feature_2_title: "Live status updates",
    feature_2_text: "Track server states in real-time: queued, downloading, converting, done, or error.",
    feature_3_title: "Auto file cleanup",
    feature_3_text: "Files in the server downloads folder are removed automatically after 6 hours.",
    faq_title: "FAQ",
    faq_q1: "Where are files stored?",
    faq_a1: "All output files are written to the server downloads directory first.",
    faq_q2: "Do I need PATH setup?",
    faq_a2: "No, local yt-dlp.exe and ffmpeg.exe in project root are supported directly on Windows.",
    faq_q3: "Is it mobile friendly?",
    faq_a3: "Yes, layout and controls are responsive and optimized for smaller screens.",
    footer_text: "RobinDown • EN/TR interface • Powered by yt-dlp + ffmpeg",
    msg_paste_url: "Paste a URL first.",
    msg_loading_info: "Loading video information...",
    msg_metadata_loaded: "Metadata loaded. Choose options and download.",
    msg_submit_job: "Submitting job to server...",
    msg_job_started: "Job started. Streaming progress now.",
    msg_connection_interrupted: "Connection interrupted. If download is still running, status can be checked by refreshing.",
    quality_none: "No explicit qualities reported",
    no_video_formats: "No explicit video formats found",
    no_audio_formats: "No explicit audio formats found",
    quality_best_available: "Best available",
    quality_smallest_fastest: "Smallest / fastest",
    quality_custom_source: "Custom source format",
    info_unknown: "Unknown",
    info_by: "By {uploader}",
    info_duration: "Duration: {duration}",
    status_idle: "Idle",
    status_created: "Created",
    status_queued: "Queued",
    status_downloading: "Downloading",
    status_converting: "Converting",
    status_done: "Completed",
    status_error: "Error",
    file_ready: "Ready: {file}",
    file_expires: "Expires",
  },
  tr: {
    app_title: "RobinDown",
    nav_downloader: "İndirici",
    nav_features: "Özellikler",
    nav_faq: "SSS",
    hero_tag: "yt-dlp ile",
    hero_title: "Hızlı YouTube İndirme, Daha Temiz Akış",
    hero_subtitle:
      "Bağlantıyı yapıştır, küçük resim ve bilgileri gör, kaliteyi seç, sonra sunucudaki indirme ve dönüştürmeyi canlı takip et.",
    hero_action_start: "İndirmeye Başla",
    hero_action_features: "Özelliklere Git",
    downloader_title: "İndirme Alanı",
    downloader_subtitle: "Aşağıdaki her şey canlıdır ve sunucudaki yt-dlp motoruna bağlıdır.",
    label_video_url: "Video URL",
    placeholder_url: "https://www.youtube.com/watch?v=...",
    btn_preview: "Önizle",
    label_type: "Tür",
    mode_video: "Video",
    mode_audio: "Ses",
    label_output_format: "Çıktı formatı",
    label_quality: "Kalite",
    label_source_format: "Özel kaynak formatı (isteğe bağlı)",
    btn_download: "İndir",
    available_qualities: "Mevcut Kaliteler",
    status_title: "Durum",
    btn_download_file: "Dosyayı İndir",
    features_title: "Neler Var",
    features_subtitle: "Net kontrol, şeffaf ilerleme ve temiz sunucu yaşam döngüsü için tasarlandı.",
    feature_1_title: "Tam format kontrolü",
    feature_1_text: "yt-dlp verilerinden video/ses çıktı formatını ve mevcut kaliteyi tam olarak seç.",
    feature_2_title: "Canlı durum güncellemeleri",
    feature_2_text: "Sunucu durumlarını anlık takip et: sırada, indiriliyor, dönüştürülüyor, tamamlandı veya hata.",
    feature_3_title: "Otomatik dosya temizliği",
    feature_3_text: "Sunucudaki downloads klasöründeki dosyalar 6 saat sonra otomatik silinir.",
    faq_title: "SSS",
    faq_q1: "Dosyalar nereye kaydediliyor?",
    faq_a1: "Çıktı dosyalarının tamamı önce sunucudaki downloads klasörüne yazılır.",
    faq_q2: "PATH ayarı gerekli mi?",
    faq_a2: "Hayır, Windows için proje kökündeki yt-dlp.exe ve ffmpeg.exe doğrudan kullanılır.",
    faq_q3: "Mobil uyumlu mu?",
    faq_a3: "Evet, yerleşim ve kontroller küçük ekranlar için uyumludur.",
    footer_text: "RobinDown • EN/TR arayüz • yt-dlp + ffmpeg ile",
    msg_paste_url: "Önce bir URL yapıştırın.",
    msg_loading_info: "Video bilgileri yükleniyor...",
    msg_metadata_loaded: "Bilgiler yüklendi. Seçenekleri belirleyip indirin.",
    msg_submit_job: "İş sunucuya gönderiliyor...",
    msg_job_started: "İş başladı. Canlı ilerleme aktarılıyor.",
    msg_connection_interrupted: "Bağlantı kesildi. İndirme sürüyorsa sayfayı yenileyip durumu görebilirsiniz.",
    quality_none: "Açık kalite bilgisi bulunamadı",
    no_video_formats: "Açık video formatı bulunamadı",
    no_audio_formats: "Açık ses formatı bulunamadı",
    quality_best_available: "En iyi mevcut",
    quality_smallest_fastest: "En küçük / en hızlı",
    quality_custom_source: "Özel kaynak formatı",
    info_unknown: "Bilinmiyor",
    info_by: "Kanal: {uploader}",
    info_duration: "Süre: {duration}",
    status_idle: "Boşta",
    status_created: "Oluşturuldu",
    status_queued: "Sırada",
    status_downloading: "İndiriliyor",
    status_converting: "Dönüştürülüyor",
    status_done: "Tamamlandı",
    status_error: "Hata",
    file_ready: "Hazır: {file}",
    file_expires: "Bitiş",
  },
};

const state = {
  info: null,
  eventSource: null,
  lang: "en",
};
const revealTimers = new Map();

function interpolate(text, vars = {}) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] == null ? `{${key}}` : String(vars[key])));
}

function t(key, vars = {}) {
  const dict = I18N[state.lang] || I18N.en;
  const raw = dict[key] || I18N.en[key] || key;
  return interpolate(raw, vars);
}

function detectInitialLanguage() {
  const stored = localStorage.getItem("lang");
  if (stored && I18N[stored]) {
    return stored;
  }

  const navLang = (navigator.language || "en").toLowerCase();
  return navLang.startsWith("tr") ? "tr" : "en";
}

function setCurrentYear() {
  if (els.currentYear) {
    els.currentYear.textContent = String(new Date().getFullYear());
  }
}

function applyStaticTranslations() {
  document.title = t("app_title");
  document.documentElement.lang = state.lang;

  const textNodes = document.querySelectorAll("[data-i18n]");
  for (const node of textNodes) {
    const key = node.getAttribute("data-i18n");
    if (key) {
      node.textContent = t(key);
    }
  }

  const placeholders = document.querySelectorAll("[data-i18n-placeholder]");
  for (const node of placeholders) {
    const key = node.getAttribute("data-i18n-placeholder");
    if (key) {
      node.setAttribute("placeholder", t(key));
    }
  }

  els.langEnBtn.classList.toggle("active", state.lang === "en");
  els.langTrBtn.classList.toggle("active", state.lang === "tr");
}

function setLanguage(lang, persist = true) {
  if (!I18N[lang]) {
    return;
  }

  state.lang = lang;
  if (persist) {
    localStorage.setItem("lang", lang);
  }

  applyStaticTranslations();

  if (state.info) {
    renderMetaInfo();
    renderAvailableQualities();
    rebuildOptions();
  } else {
    els.statusText.textContent = t("status_idle");
  }
}

function setMessage(text, isError = false) {
  els.globalMessage.textContent = text || "";
  els.globalMessage.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function revealPanel(panel) {
  if (!panel) {
    return;
  }

  panel.classList.remove("hidden");
  panel.classList.remove("panel-enter");
  void panel.offsetWidth;
  panel.classList.add("panel-enter");

  const existing = revealTimers.get(panel);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    panel.classList.remove("panel-enter");
    revealTimers.delete(panel);
  }, 260);

  revealTimers.set(panel, timer);
}

function animateUrlPaste() {
  els.urlInput.classList.remove("url-pasted");
  void els.urlInput.offsetWidth;
  els.urlInput.classList.add("url-pasted");
  setTimeout(() => {
    els.urlInput.classList.remove("url-pasted");
  }, 320);
}

function resetStatusUi() {
  revealPanel(els.statusPanel);
  els.statusText.textContent = t("status_idle");
  els.progressBar.style.width = "0%";
  els.logBox.innerHTML = "";
  els.fileMeta.textContent = "";
  els.downloadLink.classList.add("hidden");
  els.downloadLink.removeAttribute("href");
}

function appendLog(line) {
  if (!line) {
    return;
  }

  const p = document.createElement("p");
  p.textContent = line;
  els.logBox.appendChild(p);
  els.logBox.scrollTop = els.logBox.scrollHeight;
}

function fillSelect(select, items) {
  select.innerHTML = "";

  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  }
}

function preserveSelection(select, oldValue) {
  if (!oldValue) {
    return;
  }

  const options = [...select.options].map((opt) => opt.value);
  if (options.includes(oldValue)) {
    select.value = oldValue;
  }
}

function getUniqueVideoHeights(info) {
  const values = (info?.videoFormats || [])
    .map((f) => (Number.isFinite(f.height) ? f.height : null))
    .filter((h) => Number.isFinite(h));

  return [...new Set(values)].sort((a, b) => b - a);
}

function getUniqueAudioBitrates(info) {
  const values = (info?.audioFormats || [])
    .map((f) => (Number.isFinite(f.abr) ? Math.round(f.abr) : null))
    .filter((abr) => Number.isFinite(abr));

  return [...new Set(values)].sort((a, b) => b - a);
}

function renderQualityList(target, items, formatLabel) {
  target.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.textContent = t("quality_none");
    target.appendChild(li);
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = formatLabel(item);
    target.appendChild(li);
  }
}

function renderMetaInfo() {
  if (!state.info) {
    return;
  }

  const uploader = state.info.uploader || t("info_unknown");
  const duration = state.info.duration || t("info_unknown");

  els.title.textContent = state.info.title || t("info_unknown");
  els.uploader.textContent = t("info_by", { uploader });
  els.duration.textContent = t("info_duration", { duration });
}

function renderAvailableQualities() {
  if (!state.info) {
    els.availabilityPanel.classList.add("hidden");
    return;
  }

  const videoHeights = getUniqueVideoHeights(state.info);
  const audioBitrates = getUniqueAudioBitrates(state.info);

  renderQualityList(els.videoQualityList, videoHeights, (h) => `${h}p`);
  renderQualityList(els.audioQualityList, audioBitrates, (abr) => `${abr} kbps`);
  revealPanel(els.availabilityPanel);
}

function rebuildOptions() {
  if (!state.info) {
    return;
  }

  const mode = els.modeSelect.value;
  const previousFormat = els.formatSelect.value;
  const previousQuality = els.qualitySelect.value;
  const previousFormatId = els.formatIdSelect.value;

  const videoHeights = getUniqueVideoHeights(state.info);
  const audioBitrates = getUniqueAudioBitrates(state.info);

  if (mode === "video") {
    fillSelect(els.formatSelect, [
      { value: "mp4", label: "MP4" },
      { value: "webm", label: "WEBM" },
      { value: "mkv", label: "MKV" },
    ]);

    fillSelect(els.qualitySelect, [
      { value: "best", label: t("quality_best_available") },
      ...videoHeights.map((h) => ({ value: `h${h}`, label: `${h}p` })),
      { value: "worst", label: t("quality_smallest_fastest") },
      { value: "custom", label: t("quality_custom_source") },
    ]);

    const options = state.info.videoFormats.map((f) => ({ value: f.formatId, label: f.label }));
    fillSelect(els.formatIdSelect, options.length > 0 ? options : [{ value: "", label: t("no_video_formats") }]);
  } else {
    fillSelect(els.formatSelect, [
      { value: "mp3", label: "MP3" },
      { value: "m4a", label: "M4A" },
      { value: "wav", label: "WAV" },
      { value: "flac", label: "FLAC" },
      { value: "opus", label: "OPUS" },
    ]);

    fillSelect(els.qualitySelect, [
      { value: "best", label: t("quality_best_available") },
      ...audioBitrates.map((abr) => ({ value: `a${abr}`, label: `${abr} kbps` })),
      { value: "custom", label: t("quality_custom_source") },
    ]);

    const options = state.info.audioFormats.map((f) => ({ value: f.formatId, label: f.label }));
    fillSelect(els.formatIdSelect, options.length > 0 ? options : [{ value: "", label: t("no_audio_formats") }]);
  }

  preserveSelection(els.formatSelect, previousFormat);
  preserveSelection(els.qualitySelect, previousQuality);
  preserveSelection(els.formatIdSelect, previousFormatId);
  toggleFormatIdVisibility();
}

function toggleFormatIdVisibility() {
  const quality = els.qualitySelect.value;
  els.formatIdWrap.classList.toggle("hidden", quality !== "custom");
}

function getStatusLabel(status) {
  const keyMap = {
    created: "status_created",
    queued: "status_queued",
    downloading: "status_downloading",
    converting: "status_converting",
    done: "status_done",
    error: "status_error",
  };

  const key = keyMap[status] || "status_idle";
  return t(key);
}

function formatStatusText(data) {
  const label = getStatusLabel(data.status);

  if (data.status === "downloading" && typeof data.percent === "number") {
    return `${label}: ${data.percent.toFixed(1)}%`;
  }

  if (data.status === "error" && data.message) {
    return `${label}: ${data.message}`;
  }

  return label;
}

function closeEventSource() {
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }
}

async function fetchInfo() {
  const url = els.urlInput.value.trim();
  if (!url) {
    setMessage(t("msg_paste_url"), true);
    return;
  }

  setMessage(t("msg_loading_info"));
  els.fetchBtn.disabled = true;

  try {
    const response = await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load metadata.");
    }

    state.info = data;
    revealPanel(els.metaPanel);
    revealPanel(els.optionsPanel);

    els.thumb.src = data.thumbnail || "";
    els.thumb.style.display = data.thumbnail ? "block" : "none";

    renderMetaInfo();
    renderAvailableQualities();
    rebuildOptions();
    setMessage(t("msg_metadata_loaded"));
  } catch (err) {
    setMessage(err.message, true);
  } finally {
    els.fetchBtn.disabled = false;
  }
}

function bindEventStream(eventsUrl) {
  closeEventSource();

  let jobId = eventsUrl.split("/").pop();
  let reconnectAttempts = 0;
  const maxReconnects = 10;

  function handleStatusData(data) {
    if (data.status) {
      els.statusText.textContent = formatStatusText(data);
    }

    if (typeof data.percent === "number") {
      els.progressBar.style.width = `${Math.max(0, Math.min(100, data.percent))}%`;
    }

    if (data.logLine) {
      appendLog(data.logLine);
    }

    if (data.status === "done") {
      const locale = state.lang === "tr" ? "tr-TR" : "en-US";
      if (data.fileName) {
        els.fileMeta.textContent = t("file_ready", { file: data.fileName });
      }
      if (data.expiresAt) {
        const expiry = new Date(data.expiresAt).toLocaleString(locale);
        els.fileMeta.textContent += ` | ${t("file_expires")}: ${expiry}`;
      }
      if (data.downloadUrl) {
        els.downloadLink.href = data.downloadUrl;
        els.downloadLink.classList.remove("hidden");
      }
      closeEventSource();
      return true;
    }

    if (data.status === "error") {
      closeEventSource();
      return true;
    }

    return false;
  }

  function pollStatus() {
    fetch(`/api/job/${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        const finished = handleStatusData(data);
        if (!finished && reconnectAttempts < maxReconnects) {
          reconnectAttempts++;
          setTimeout(() => connectSSE(), 2000);
        } else if (!finished) {
          appendLog(t("msg_connection_interrupted"));
        }
      })
      .catch(() => {
        appendLog(t("msg_connection_interrupted"));
      });
  }

  function connectSSE() {
    closeEventSource();

    const es = new EventSource(eventsUrl);
    state.eventSource = es;

    es.addEventListener("status", (event) => {
      reconnectAttempts = 0;
      const data = JSON.parse(event.data);
      handleStatusData(data);
    });

    es.onerror = () => {
      closeEventSource();
      pollStatus();
    };
  }

  connectSSE();
}

async function startDownload() {
  const url = els.urlInput.value.trim();
  if (!url) {
    setMessage(t("msg_paste_url"), true);
    return;
  }

  resetStatusUi();
  setMessage(t("msg_submit_job"));
  els.downloadBtn.disabled = true;

  try {
    const payload = {
      url,
      mode: els.modeSelect.value,
      format: els.formatSelect.value,
      quality: els.qualitySelect.value,
      selectedFormatId: els.formatIdSelect.value,
    };

    if (payload.quality !== "custom") {
      payload.selectedFormatId = "";
    }

    const response = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Download request failed.");
    }

    bindEventStream(data.eventsUrl);
    setMessage(t("msg_job_started"));
  } catch (err) {
    setMessage(err.message, true);
  } finally {
    els.downloadBtn.disabled = false;
  }
}

els.fetchBtn.addEventListener("click", fetchInfo);
els.downloadBtn.addEventListener("click", startDownload);
els.modeSelect.addEventListener("change", rebuildOptions);
els.qualitySelect.addEventListener("change", toggleFormatIdVisibility);
els.langEnBtn.addEventListener("click", () => setLanguage("en"));
els.langTrBtn.addEventListener("click", () => setLanguage("tr"));
els.urlInput.addEventListener("paste", () => {
  requestAnimationFrame(animateUrlPaste);
});

els.urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    fetchInfo();
  }
});

setLanguage(detectInitialLanguage(), false);
setCurrentYear();
