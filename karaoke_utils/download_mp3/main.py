import logging
import os
import re
import shutil
import subprocess
import tempfile
import threading
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MP3 Download Service")

_jobs: dict[str, dict] = {}
_lock = threading.Lock()


def _safe_filename(title: str) -> str:
    """Strip filesystem-unsafe characters and truncate."""
    return re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", title).strip()[:200]


class DownloadRequest(BaseModel):
    video_url: str
    video_title: str = ""


def _run_download(job_id: str, video_url: str, output_path: str) -> None:
    with _lock:
        _jobs[job_id]["status"] = "downloading"
        _jobs[job_id]["progress_message"] = "Downloading audio…"
    logger.info("Job %s: starting yt-dlp for %s", job_id, video_url)
    try:
        result = subprocess.run(
            [
                "yt-dlp",
                "-f", "bestaudio/best",
                "-x",
                "--audio-format", "mp3",
                "--audio-quality", "0",
                "--embed-thumbnail",        # embed YouTube thumbnail as album art
                "--convert-thumbnails", "jpg",  # convert WebP → JPEG before embedding
                "--embed-metadata",     # write ID3 tags (title, artist, album, etc.)
                "--no-playlist",
                "-o", output_path,
                video_url,
            ],
            capture_output=True,
            text=True,
        )
        logger.info("Job %s: yt-dlp rc=%d", job_id, result.returncode)
        if result.returncode != 0:
            err = result.stderr[-500:] or result.stdout[-500:] or "yt-dlp failed with no output"
            logger.error("Job %s: yt-dlp failed\nstdout: %s\nstderr: %s",
                         job_id, result.stdout[-2000:], result.stderr[-2000:])
            with _lock:
                _jobs[job_id]["status"] = "error"
                _jobs[job_id]["error"] = err
            return
        with _lock:
            _jobs[job_id]["status"] = "done"
            _jobs[job_id]["progress_message"] = "MP3 ready"
        logger.info("Job %s: MP3 download complete → %s.mp3", job_id, output_path)
    except Exception as e:
        logger.exception("MP3 download failed for job %s", job_id)
        with _lock:
            _jobs[job_id]["status"] = "error"
            _jobs[job_id]["error"] = str(e)


@app.post("/download")
def download(req: DownloadRequest, background_tasks: BackgroundTasks):
    job_id = uuid.uuid4().hex
    tmp_dir = tempfile.mkdtemp(prefix="mp3_")
    safe_title = _safe_filename(req.video_title) if req.video_title else job_id
    output_template = os.path.join(tmp_dir, safe_title)
    output_path = f"{output_template}.mp3"
    with _lock:
        _jobs[job_id] = {
            "status": "queued",
            "path": output_path,
            "progress_message": "Job queued…",
            "error": None,
        }
    background_tasks.add_task(_run_download, job_id, req.video_url, output_template)
    return {"job_id": job_id}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    with _lock:
        job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress_message": job["progress_message"],
        "error": job["error"],
    }


@app.get("/file/{job_id}")
def get_file(job_id: str):
    with _lock:
        job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] == "error":
        raise HTTPException(status_code=500, detail=job["error"])
    if job["status"] != "done" or not job["path"]:
        raise HTTPException(status_code=409, detail="File not ready")

    file_path = job["path"]
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=Path(file_path).name,
    )


class SaveRequest(BaseModel):
    sub_path: str


@app.post("/save/{job_id}")
def save_file(job_id: str, req: SaveRequest):
    output_dir = os.environ.get("OUTPUT_DIR")
    if not output_dir:
        raise HTTPException(status_code=400, detail="OUTPUT_DIR not configured on server")

    with _lock:
        job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] == "error":
        raise HTTPException(status_code=500, detail=job["error"])
    if job["status"] != "done" or not job["path"]:
        raise HTTPException(status_code=409, detail="File not ready yet")

    src = job["path"]
    if not os.path.isfile(src):
        raise HTTPException(status_code=404, detail="Source file missing on disk")

    # Prevent path traversal outside OUTPUT_DIR
    dest_dir = os.path.realpath(os.path.join(output_dir, req.sub_path))
    if not dest_dir.startswith(os.path.realpath(output_dir)):
        raise HTTPException(status_code=400, detail="Invalid path: must be within OUTPUT_DIR")

    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, os.path.basename(src))
    shutil.copy2(src, dest)
    logger.info("Job %s: saved to %s", job_id, dest)
    return {"saved_to": dest}


@app.get("/health")
def health():
    return {"status": "ok"}
