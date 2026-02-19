# Karaoke Maker

Search YouTube, download MP3s, and generate karaoke tracks with AI vocal removal — all from a web UI.

## Features

- **Search** any YouTube video
- **Stream** — watch it in an embedded player
- **MP3** — download the audio as an MP3 (progress shown while downloading)
- **Karaoke** — strip the vocals using AI; download as **MP4 video** or **MP3 audio**

Vocal removal is powered by [Demucs](https://github.com/facebookresearch/demucs) (Meta's open-source AI model, PyTorch-based).

---

## Running with Docker (recommended)

Requires [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/).

```bash
docker compose up --build
```

Then open http://localhost:3000.

> On the **first karaoke request**, Demucs downloads its pretrained HTDemucs model (~80 MB). This is cached in a Docker volume so subsequent runs are instant.

To stop all services:

```bash
docker compose down
```

---

## Running manually (development)

### Prerequisites

- Node.js 20+
- Python 3.11
- `ffmpeg` installed on your system

```bash
# Ubuntu / Debian
sudo apt install ffmpeg
# Fedora
sudo dnf install ffmpeg
```

### Start the services (4 terminals)

**Terminal 1 — YouTube search**
```bash
cd karaoke_utils/youtube_search
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**Terminal 2 — MP3 download**
```bash
cd karaoke_utils/download_mp3
pip install -r requirements.txt
pip install "https://github.com/yt-dlp/yt-dlp/archive/refs/heads/master.tar.gz"
uvicorn main:app --reload --port 8002
```

**Terminal 3 — Karaoke driver**
```bash
cd karaoke_utils/karaoke_driver
pip install -r requirements.txt
pip install "https://github.com/yt-dlp/yt-dlp/archive/refs/heads/master.tar.gz"
uvicorn main:app --reload --port 8003
```

**Terminal 4 — Frontend**
```bash
cd karaoke_web
npm install
npm run dev
```

Then open http://localhost:3000.

---

## Running tests

**Python services** (run from each service directory):
```bash
pytest tests/ -v
```

**Next.js frontend** (run from `karaoke_web/`):
```bash
npm test
```

---

## Architecture

```
Browser (React, Tailwind CSS, shadcn/ui)
  → Next.js App Router (port 3000)
      → /api/* routes (BFF proxy layer)
            → youtube-search  (port 8001)  — youtubesearchpython
            → mp3-download    (port 8002)  — yt-dlp (GitHub master)
            → karaoke-driver  (port 8003)  — yt-dlp, demucs, ffmpeg
```

All services expose a `/health` endpoint. The frontend polls job status every 3 seconds for both MP3 downloads and karaoke generation.

### Karaoke pipeline

1. Download audio as `original.mp3` via yt-dlp
2. Separate vocals/accompaniment with Demucs (`htdemucs`, 2-stem)
3. Convert `no_vocals.wav` → `final.mp3` via ffmpeg
4. Encode `final.mp3` into an MP4 with a dark background via ffmpeg
5. Serve as downloadable MP4 or MP3

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| API proxy | Next.js App Router API routes |
| YouTube search | FastAPI + youtubesearchpython |
| MP3 download | FastAPI + yt-dlp |
| Karaoke driver | FastAPI + yt-dlp + Demucs + ffmpeg |
| Containerisation | Docker Compose |
