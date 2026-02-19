import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app, _jobs

client = TestClient(app)

YOUTUBE_URL = "https://www.youtube.com/watch?v=test123"


def _reset_jobs():
    _jobs.clear()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200


@patch("main.subprocess.run")
@patch("main.Path.glob")
def test_download_success(mock_glob, mock_run, tmp_path):
    _reset_jobs()
    fake_mp3 = tmp_path / "My Song.mp3"
    fake_mp3.write_bytes(b"ID3fake")

    mock_run.return_value = MagicMock(returncode=0, stderr="")
    mock_glob.return_value = [fake_mp3]

    response = client.post("/download", json={"video_url": YOUTUBE_URL})

    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["file_name"].endswith(".mp3")

    # yt-dlp called with correct flags
    call_args = mock_run.call_args[0][0]
    assert "yt-dlp" in call_args
    assert "--audio-format" in call_args
    assert "mp3" in call_args
    assert YOUTUBE_URL in call_args


@patch("main.subprocess.run")
def test_download_ytdlp_failure(mock_run):
    _reset_jobs()
    mock_run.return_value = MagicMock(returncode=1, stderr="video unavailable")

    response = client.post("/download", json={"video_url": YOUTUBE_URL})
    assert response.status_code == 500
    assert "video unavailable" in response.json()["detail"]


@patch("main.subprocess.run")
@patch("main.Path.glob")
def test_download_no_mp3_produced(mock_glob, mock_run):
    _reset_jobs()
    mock_run.return_value = MagicMock(returncode=0, stderr="")
    mock_glob.return_value = []

    response = client.post("/download", json={"video_url": YOUTUBE_URL})
    assert response.status_code == 500
    assert "No MP3" in response.json()["detail"]


def test_get_file_not_found():
    response = client.get("/file/nonexistent_job_id")
    assert response.status_code == 404


def test_get_file_job_error():
    _jobs["err_job"] = {"status": "error", "path": None, "error": "download failed"}
    response = client.get("/file/err_job")
    assert response.status_code == 500


def test_get_file_not_ready():
    _jobs["pending_job"] = {"status": "downloading", "path": None, "error": None}
    response = client.get("/file/pending_job")
    assert response.status_code == 409


def test_get_file_success(tmp_path):
    fake_mp3 = tmp_path / "song.mp3"
    fake_mp3.write_bytes(b"ID3data")
    _jobs["done_job"] = {"status": "done", "path": str(fake_mp3), "error": None}

    response = client.get("/file/done_job")
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
