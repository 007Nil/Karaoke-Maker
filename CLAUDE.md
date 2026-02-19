# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Karaoke Maker is a full-stack app that lets users search YouTube, download MP3s, and generate karaoke versions (vocals removed). It is a monorepo with:

- `karaoke_web/` — Next.js 14 App Router frontend (TypeScript, Tailwind CSS, shadcn/ui)
- `karaoke_utils/` — Three isolated FastAPI Python microservices

## Commands

### Web App (run from `karaoke_web/`)

```bash
npm run dev        # Start Next.js dev server on port 3000
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run Jest tests
npm run test:watch # Watch mode
```

### Python Services (each run from their own directory)

```bash
uvicorn main:app --reload --port 8001   # youtube_search
uvicorn main:app --reload --port 8002   # download_mp3
uvicorn main:app --reload --port 8003   # karaoke_driver

# Run tests in any service directory:
pytest tests/ -v
```

### Docker (run from repo root)

```bash
docker compose up --build    # Build and start all 4 services
docker compose up web        # Start just the frontend (Python services must be running)
docker compose down          # Stop all services
```

## Architecture

The app uses a **Next.js API-route BFF pattern**: the React frontend calls Next.js App Router API routes, which proxy to the Python FastAPI services.

```
Browser (React, Tailwind, shadcn/ui)
  → HTTP calls via fetch to /api/* (Next.js BFF layer)
  → Next.js API routes proxy to Python FastAPI services:
        youtube-search  (port 8001)
        mp3-download    (port 8002)
        karaoke-driver  (port 8003)
```

### Environment Variables (Next.js)

Set in `docker-compose.yml` or in `.env.local` for local dev:

```
YOUTUBE_SEARCH_URL=http://localhost:8001
MP3_DOWNLOAD_URL=http://localhost:8002
KARAOKE_URL=http://localhost:8003
```

### Data Flow

1. **Search**: User types → `GET /api/search?query=` → proxies to `youtube-search:8001/search` → returns `VideoResult[]`
2. **MP3 Download**: User clicks MP3 → `POST /api/download-mp3 {video_url}` → proxies to `mp3-download:8002/download` → returns `{job_id, file_name}` → `GET /api/download?type=mp3&job_id=` streams the file
3. **Karaoke**: User clicks Karaoke → `POST /api/karaoke {video_url}` → proxies to `karaoke-driver:8003/karaoke` → returns `{job_id}` → frontend polls `GET /api/job/{id}` every 3s → download button appears when `status=done`

### Karaoke Pipeline (`karaoke_utils/karaoke_driver/`)

Status states: `queued → downloading → extracting → separating → encoding → done | error`

1. Download YouTube video as `raw.mp4` (pytubefix)
2. Extract audio as `original.mp3` (moviepy)
3. Separate vocals/accompaniment into stems (spleeter 2-stem)
4. Convert `accompaniment.wav` → `final.mp3` (ffmpeg)
5. Mux `final.mp3` into `raw.mp4` → `final.mp4` (moviepy)
6. Rename to `<sanitized_video_title>.mp4`

### Python Service Requirements

Each service has its own `requirements.txt` and `Dockerfile`. Python version matters for spleeter:

- `youtube_search` — Python 3.11, requires `youtubesearchpython`, `fastapi`, `uvicorn`
- `download_mp3` — Python 3.11, requires `yt-dlp`, `fastapi`, `uvicorn`; ffmpeg in Docker image
- `karaoke_driver` — **Python 3.8** (required for spleeter/TensorFlow), requires `spleeter`, `moviepy`, `pytubefix`, `fastapi`, `uvicorn`; ffmpeg + libsndfile1 in Docker image

### Job Store (`karaoke_driver/job_store.py`)

Thread-safe in-memory job registry. `store` is a singleton `JobStore` instance imported by `main.py`. Job states are managed via `store.update()`, `store.set_done()`, `store.set_error()`.

### Key Files

| Purpose | Path |
|---|---|
| Main page | `karaoke_web/src/app/page.tsx` |
| Search API route | `karaoke_web/src/app/api/search/route.ts` |
| Karaoke API route | `karaoke_web/src/app/api/karaoke/route.ts` |
| Job status API route | `karaoke_web/src/app/api/job/[id]/route.ts` |
| File download API route | `karaoke_web/src/app/api/download/route.ts` |
| Shared types | `karaoke_web/src/lib/types.ts` |
| API client functions | `karaoke_web/src/lib/api.ts` |
| VideoCard component | `karaoke_web/src/components/VideoCard.tsx` |
| Karaoke status modal | `karaoke_web/src/components/KaraokeStatusModal.tsx` |
| Karaoke FastAPI app | `karaoke_utils/karaoke_driver/main.py` |
| Job store | `karaoke_utils/karaoke_driver/job_store.py` |
| Karaoke modules | `karaoke_utils/karaoke_driver/modules/` |
