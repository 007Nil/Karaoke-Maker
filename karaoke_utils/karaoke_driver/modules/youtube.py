import logging
import os
import subprocess

logger = logging.getLogger(__name__)


def get_video_title(link: str) -> str:
    result = subprocess.run(
        ["yt-dlp", "--print", "%(title)s", "--no-playlist", link],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def download_audio_only(link: str, tmp_dir: str) -> None:
    """Download audio as original.mp3 — same proven approach as the mp3-download service."""
    output_path = os.path.join(tmp_dir, "original.mp3")
    result = subprocess.run(
        [
            "yt-dlp",
            "-f", "bestaudio/best",
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "--no-playlist",
            "-o", output_path,
            link,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("yt-dlp stderr:\n%s", result.stderr[-2000:])
        raise RuntimeError(f"yt-dlp audio download failed: {result.stderr[-500:]}")
    logger.info("Downloaded audio to %s", output_path)
