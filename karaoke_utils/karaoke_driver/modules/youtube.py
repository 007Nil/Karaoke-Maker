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


def download_video(link: str, tmp_dir: str) -> None:
    """Download full YouTube video (video + audio merged) as raw.mp4."""
    output_path = os.path.join(tmp_dir, "raw.mp4")
    result = subprocess.run(
        [
            "yt-dlp",
            "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
            "--merge-output-format", "mp4",
            "--no-playlist",
            "-o", output_path,
            link,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("yt-dlp stderr:\n%s", result.stderr[-2000:])
        raise RuntimeError(f"yt-dlp video download failed: {result.stderr[-500:]}")
    logger.info("Downloaded video to %s", output_path)


def extract_audio(tmp_dir: str) -> None:
    """Extract audio track from raw.mp4 → original.mp3 using ffmpeg."""
    src = os.path.join(tmp_dir, "raw.mp4")
    dst = os.path.join(tmp_dir, "original.mp3")
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", src, "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k", dst],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg audio extraction failed: {result.stderr[-300:]}")
    logger.info("Extracted audio to %s", dst)
