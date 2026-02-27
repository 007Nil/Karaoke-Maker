import logging
import os
import shutil
import tempfile
import uuid

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

import modules.youtube as ytube
import modules.video_edit as ve
import modules.vocal_remover as vr
import modules.utils as utils
from job_store import JobStatus, store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Karaoke Driver Service")


class KaraokeRequest(BaseModel):
    video_url: str


def _run_pipeline(job_id: str, video_url: str, tmp_dir: str) -> None:
    try:
        store.update(job_id, status=JobStatus.DOWNLOADING, progress_message="Downloading video…")
        video_title = ytube.get_video_title(video_url)
        ytube.download_video(video_url, tmp_dir)

        store.update(job_id, status=JobStatus.EXTRACTING, progress_message="Extracting audio…")
        ytube.extract_audio(tmp_dir)

        store.update(job_id, status=JobStatus.SEPARATING, progress_message="Removing vocals (this takes a while)…")
        vr.remove_vocals(tmp_dir)
        utils.copy_accompaniment_file(tmp_dir)

        store.update(job_id, status=JobStatus.ENCODING, progress_message="Encoding karaoke video…")
        utils.convert_wav_to_mp3(tmp_dir)
        ve.create_karaoke_video(tmp_dir)
        output_path = utils.rename_final_video(tmp_dir, video_title, tmp_dir)

        store.set_done(job_id, output_path)
        logger.info("Job %s complete: %s", job_id, output_path)

    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        store.set_error(job_id, str(exc))


@app.post("/karaoke")
def create_karaoke(req: KaraokeRequest, background_tasks: BackgroundTasks):
    job_id = uuid.uuid4().hex
    tmp_dir = tempfile.mkdtemp(prefix="karaoke_")
    store.create(job_id)
    background_tasks.add_task(_run_pipeline, job_id, req.video_url, tmp_dir)
    return {"job_id": job_id}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job.job_id,
        "status": job.status,
        "progress_message": job.progress_message,
        "error": job.error,
    }


@app.get("/file/{job_id}")
def get_file(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == JobStatus.ERROR:
        raise HTTPException(status_code=500, detail=job.error)
    if job.status != JobStatus.DONE or not job.output_path:
        raise HTTPException(status_code=409, detail="File not ready yet")
    if not os.path.isfile(job.output_path):
        raise HTTPException(status_code=404, detail="Output file missing on disk")

    return FileResponse(
        path=job.output_path,
        media_type="video/mp4",
        filename=os.path.basename(job.output_path),
    )


@app.get("/mp3/{job_id}")
def get_mp3(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == JobStatus.ERROR:
        raise HTTPException(status_code=500, detail=job.error)
    if job.status != JobStatus.DONE or not job.output_path:
        raise HTTPException(status_code=409, detail="File not ready yet")

    mp3_path = os.path.join(os.path.dirname(job.output_path), "final.mp3")
    if not os.path.isfile(mp3_path):
        raise HTTPException(status_code=404, detail="MP3 file missing on disk")

    mp3_filename = os.path.basename(job.output_path).replace(".mp4", ".mp3")
    return FileResponse(
        path=mp3_path,
        media_type="audio/mpeg",
        filename=mp3_filename,
    )


class SaveRequest(BaseModel):
    sub_path: str
    file_type: str  # "mp4" or "mp3"


@app.post("/save/{job_id}")
def save_file(job_id: str, req: SaveRequest):
    output_dir = os.environ.get("OUTPUT_DIR")
    if not output_dir:
        raise HTTPException(status_code=400, detail="OUTPUT_DIR not configured on server")

    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == JobStatus.ERROR:
        raise HTTPException(status_code=500, detail=job.error)
    if job.status != JobStatus.DONE or not job.output_path:
        raise HTTPException(status_code=409, detail="File not ready yet")

    if req.file_type == "mp3":
        src = os.path.join(os.path.dirname(job.output_path), "final.mp3")
    else:
        src = job.output_path

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
