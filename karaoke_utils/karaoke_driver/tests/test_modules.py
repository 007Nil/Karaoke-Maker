"""Unit tests for individual karaoke_driver modules."""
import os
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, call, patch

import pytest

from modules.utils import _safe_filename, copy_accompaniment_file, convert_wav_to_mp3, rename_final_video


# ── utils.py ──────────────────────────────────────────────────────────────────

def test_safe_filename_strips_invalid_chars():
    assert _safe_filename('Hello: "World"') == "Hello World"
    assert _safe_filename("A/B\\C") == "ABC"
    assert _safe_filename("normal title") == "normal title"


def test_safe_filename_empty_becomes_default():
    assert _safe_filename("   ") == "karaoke_output"
    assert _safe_filename(":/<>") == "karaoke_output"


def test_copy_accompaniment_file(tmp_path):
    sub = tmp_path / "original"
    sub.mkdir()
    src = sub / "accompaniment.wav"
    src.write_bytes(b"RIFF")

    copy_accompaniment_file(str(tmp_path))
    dst = tmp_path / "accompaniment.wav"
    assert dst.exists()
    assert dst.read_bytes() == b"RIFF"


@patch("modules.utils.subprocess.run")
def test_convert_wav_to_mp3_calls_ffmpeg(mock_run, tmp_path):
    mock_run.return_value = MagicMock(returncode=0, stderr="")
    convert_wav_to_mp3(str(tmp_path))

    call_args = mock_run.call_args[0][0]
    assert "ffmpeg" in call_args
    assert str(tmp_path / "accompaniment.wav") in call_args
    assert str(tmp_path / "final.mp3") in call_args
    assert "192k" in call_args


@patch("modules.utils.subprocess.run")
def test_convert_wav_to_mp3_raises_on_failure(mock_run, tmp_path):
    mock_run.return_value = MagicMock(returncode=1, stderr="codec error")
    with pytest.raises(RuntimeError, match="ffmpeg failed"):
        convert_wav_to_mp3(str(tmp_path))


def test_rename_final_video(tmp_path):
    src = tmp_path / "final.mp4"
    src.write_bytes(b"\x00")

    result = rename_final_video(str(tmp_path), "My Song", str(tmp_path))
    expected = str(tmp_path / "My Song.mp4")
    assert result == expected
    assert os.path.isfile(expected)
    assert not src.exists()


def test_rename_final_video_sanitises_title(tmp_path):
    src = tmp_path / "final.mp4"
    src.write_bytes(b"\x00")
    result = rename_final_video(str(tmp_path), 'Bad: "Title"', str(tmp_path))
    assert "Bad Title.mp4" in result


# ── youtube.py ────────────────────────────────────────────────────────────────

@patch("modules.youtube.YouTube")
def test_get_video_title(mock_yt_cls):
    mock_yt = MagicMock()
    mock_yt.title = "Test Video Title"
    mock_yt_cls.return_value = mock_yt

    from modules.youtube import get_video_title
    title = get_video_title("https://www.youtube.com/watch?v=test")
    assert title == "Test Video Title"


@patch("modules.youtube.YouTube")
def test_download_youtube_video_uses_filename_param(mock_yt_cls, tmp_path):
    mock_stream = MagicMock()
    mock_stream.download.return_value = str(tmp_path / "raw.mp4")
    mock_yt = MagicMock()
    mock_yt.streams.get_highest_resolution.return_value = mock_stream
    mock_yt_cls.return_value = mock_yt

    from modules.youtube import download_youtube_video
    download_youtube_video("https://www.youtube.com/watch?v=test", str(tmp_path))

    mock_stream.download.assert_called_once_with(output_path=str(tmp_path), filename="raw.mp4")


@patch("modules.youtube.YouTube")
def test_download_raises_when_no_stream(mock_yt_cls, tmp_path):
    mock_yt = MagicMock()
    mock_yt.streams.get_highest_resolution.return_value = None
    mock_yt_cls.return_value = mock_yt

    from modules.youtube import download_youtube_video
    with pytest.raises(RuntimeError, match="No video stream"):
        download_youtube_video("https://www.youtube.com/watch?v=test", str(tmp_path))
