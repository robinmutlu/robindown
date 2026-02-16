# RobinDown

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

```text
 ____       _     _       ____                      
|  _ \ ___ | |__ (_)_ __ |  _ \  _____      ___ __ 
| |_) / _ \| '_ \| | '_ \| | | |/ _ \ \ /\ / / '_ \
|  _ < (_) | |_) | | | | | |_| | (_) \ V  V /| | | |
|_| \_\___/|_.__/|_|_| |_|____/ \___/ \_/\_/ |_| |_|
```

> :clapper: Download YouTube media with a clean EN/TR interface, powered by `yt-dlp` + `ffmpeg`.

## :sparkles: What This Project Is
RobinDown is a full-stack downloader app with:
- Express backend for metadata + download job orchestration
- Live progress over Server-Sent Events (SSE)
- Modern responsive frontend with English/Turkish localization
- Docker-ready deployment for VPS/server use

## :mag: Full Project Analysis
### Core stack
- Backend: Node.js + Express (`server.js`)
- Frontend: Vanilla HTML/CSS/JS (`public/`)
- Media engine: `yt-dlp` + `ffmpeg`
- Runtime storage: `downloads/` (auto cleanup)

### Backend architecture
- URL safety filter:
  - By default only YouTube hosts are accepted
  - `ALLOW_ANY_URL=1` disables host restriction
- Metadata endpoint:
  - `POST /api/info` calls `yt-dlp -J --no-playlist`
  - Parses title, uploader, duration, thumbnail, and format lists
- Download workflow:
  - `POST /api/download` creates a job ID
  - Job state is held in memory (`Map`)
  - `yt-dlp` runs as child process with parsed progress lines
  - States: `created` -> `queued` -> `downloading` -> `converting` -> `done/error`
- Live updates:
  - `GET /api/events/:jobId` streams updates through SSE
  - `GET /api/job/:jobId` fallback polling endpoint
- File serving:
  - `GET /api/file/:jobId` sends completed file to client
- Safety and limits:
  - Per-IP API rate limit
  - Active job cap (`MAX_ACTIVE_JOBS`)
  - Periodic cleanup every 10 minutes
  - Retention window: 6 hours

### Frontend architecture
- Single-page UX with sections:
  - Hero, Downloader, Features, FAQ
- Workflow:
  - Paste URL -> fetch metadata -> choose options -> start download -> stream status -> get file link
- Media controls:
  - Video/audio mode
  - Output format selection
  - Dynamic quality choices from actual available formats
  - Optional direct `format_id` custom selection
- Localization:
  - `EN` / `TR` toggle with localStorage persistence

### Deployment and ops
- Dockerfile installs `yt-dlp` and `ffmpeg` in container
- Docker compose exposes `4455` and persists `downloads/` as a named volume
- Health endpoint: `GET /healthz`

## :rocket: Quick Start
### 1) Requirements
- Node.js 18+
- `yt-dlp` and `ffmpeg` available by:
  - PATH, or
  - local binaries in project root (`yt-dlp.exe`, `ffmpeg.exe` on Windows)

Check tools:
```powershell
yt-dlp --version
ffmpeg -version
```

### 2) Install and run
```powershell
npm install
npm start
```

Open:
- `http://localhost:4455`

## :whale: Docker
Run with Docker Compose:
```bash
docker compose up -d --build
```

Useful commands:
```bash
docker compose ps
docker compose logs -f robindown
docker compose down
```

## :gear: Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4455` | Server port |
| `YTDLP_BIN` | auto | yt-dlp command/path override |
| `FFMPEG_BIN` | auto | ffmpeg command/path override |
| `ALLOW_ANY_URL` | `0` | Accept non-YouTube URLs if set to `1` |
| `MAX_ACTIVE_JOBS` | `3` | Concurrent active downloads |
| `API_RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit time window |
| `API_RATE_LIMIT_MAX` | `45` | Max API requests per IP per window |

## :jigsaw: API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | Health check |
| `POST` | `/api/info` | Read media metadata and available formats |
| `POST` | `/api/download` | Start a download job |
| `GET` | `/api/events/:jobId` | SSE stream for live job updates |
| `GET` | `/api/job/:jobId` | Poll job status snapshot |
| `GET` | `/api/file/:jobId` | Download completed file |

## :file_folder: Project Structure
```text
.
|-- server.js
|-- package.json
|-- Dockerfile
|-- docker-compose.yml
|-- public/
|   |-- index.html
|   |-- styles.css
|   `-- app.js
|-- img/
`-- downloads/   (runtime output, auto-cleaned)
```

## :lock: Security Notes
- Current defaults are decent for personal/private deployment.
- For public production exposure:
  - Put behind HTTPS reverse proxy (Nginx/Caddy/Traefik)
  - Add authentication
  - Keep firewall strict
  - Monitor logs and resource usage
  - Keep dependencies, `yt-dlp`, and image updated

## :hammer_and_wrench: Troubleshooting
- `yt-dlp not found`:
  - Install it or set `YTDLP_BIN`
- `ffmpeg not found`:
  - Install it or set `FFMPEG_BIN`
- `Port already in use`:
  - Set another `PORT` value
- `Server is busy`:
  - Increase `MAX_ACTIVE_JOBS` carefully

## :warning: Legal / Usage
Use RobinDown only for content you have rights to access/download and in accordance with platform terms and local laws.

## :page_facing_up: License
This project is licensed under the MIT License.  
See `LICENSE` for details.

## :bust_in_silhouette: Author
Robin Mutlu  
Website: `https://rob1n.dev`
