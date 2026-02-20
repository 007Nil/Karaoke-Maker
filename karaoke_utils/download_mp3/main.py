import logging
import os
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


class DownloadRequest(BaseModel):
    video_url: str


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
    # Pass a template WITHOUT extension so yt-dlp appends .mp3 cleanly after
    # audio extraction; avoid ambiguity when the template itself ends in .mp3.
    output_template = os.path.join(tmp_dir, job_id)
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


@app.get("/health")
def health():
    return {"status": "ok"}
