import logging
import os
import re
import shutil
import subprocess

logger = logging.getLogger(__name__)


def _safe_filename(title: str) -> str:
    """Strip characters that are invalid in filenames."""
    return re.sub(r'[<>:"/\\|?*]', "", title).strip() or "karaoke_output"


def copy_accompaniment_file(working_dir: str) -> None:
    src = os.path.join(working_dir, "original", "accompaniment.wav")
    dst = os.path.join(working_dir, "accompaniment.wav")
    shutil.copy2(src, dst)
    logger.info("Copied accompaniment.wav to %s", working_dir)


def convert_wav_to_mp3(working_dir: str) -> None:
    src = os.path.join(working_dir, "accompaniment.wav")
    dst = os.path.join(working_dir, "final.mp3")
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", src, "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k", dst],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr[-300:]}")
    logger.info("Converted accompaniment to %s", dst)


def rename_final_video(working_dir: str, title: str, dest: str) -> str:
    safe_name = _safe_filename(title) + ".mp4"
    src = os.path.join(working_dir, "final.mp4")
    dst = os.path.join(dest, safe_name)
    os.replace(src, dst)
    logger.info("Final karaoke video: %s", dst)
    return dst
