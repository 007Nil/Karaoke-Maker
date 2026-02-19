"""Tests for the FastAPI karaoke service and pipeline orchestration."""
import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from job_store import JobStatus, store
from main import app

client = TestClient(app)

YOUTUBE_URL = "https://www.youtube.com/watch?v=test123"


def _wait_for_job(job_id: str, target_statuses, timeout: float = 5.0, interval: float = 0.1):
    deadline = time.time() + timeout
    while time.time() < deadline:
        job = store.get(job_id)
        if job and job.status in target_statuses:
            return job
        time.sleep(interval)
    return store.get(job_id)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200


def test_status_not_found():
    response = client.get("/status/nonexistent")
    assert response.status_code == 404


def test_file_not_found():
    response = client.get("/file/nonexistent")
    assert response.status_code == 404


@patch("main.ytube.get_video_title", return_value="Test Song")
@patch("main.ytube.download_youtube_video")
@patch("main.ve.extract_audio_from_video")
@patch("main.vr.remove_vocals")
@patch("main.utils.copy_accompaniment_file")
@patch("main.utils.convert_wav_to_mp3")
@patch("main.ve.add_audio_to_video")
@patch("main.utils.rename_final_video", return_value="/tmp/karaoke_test/Test Song.mp4")
def test_pipeline_success(
    mock_rename, mock_add_audio, mock_convert, mock_copy,
    mock_remove_vocals, mock_extract, mock_download, mock_title,
    tmp_path,
):
    # Create the fake output file so FileResponse can serve it
    fake_output = tmp_path / "Test Song.mp4"
    fake_output.write_bytes(b"\x00" * 100)
    mock_rename.return_value = str(fake_output)

    response = client.post("/karaoke", json={"video_url": YOUTUBE_URL})
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    job = _wait_for_job(job_id, {JobStatus.DONE, JobStatus.ERROR})
    assert job is not None
    assert job.status == JobStatus.DONE
    assert job.output_path == str(fake_output)

    # Verify all pipeline steps were called in order
    mock_title.assert_called_once_with(YOUTUBE_URL)
    mock_download.assert_called_once()
    mock_extract.assert_called_once()
    mock_remove_vocals.assert_called_once()
    mock_copy.assert_called_once()
    mock_convert.assert_called_once()
    mock_add_audio.assert_called_once()
    mock_rename.assert_called_once()


@patch("main.ytube.get_video_title", return_value="Test Song")
@patch("main.ytube.download_youtube_video", side_effect=RuntimeError("download failed"))
def test_pipeline_download_failure(mock_download, mock_title):
    response = client.post("/karaoke", json={"video_url": YOUTUBE_URL})
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    job = _wait_for_job(job_id, {JobStatus.ERROR})
    assert job is not None
    assert job.status == JobStatus.ERROR
    assert "download failed" in (job.error or "")


def test_status_queued_then_done():
    """Status endpoint returns correct data at each stage."""
    # Inject a done job directly into the store
    store.create("manual_done")
    store.set_done("manual_done", "/tmp/fake.mp4")

    response = client.get("/status/manual_done")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == JobStatus.DONE
    assert data["error"] is None


def test_file_not_ready():
    store.create("pending_job_kd")
    response = client.get("/file/pending_job_kd")
    assert response.status_code == 409


def test_file_error_job():
    store.create("error_job_kd")
    store.set_error("error_job_kd", "something broke")
    response = client.get("/file/error_job_kd")
    assert response.status_code == 500
