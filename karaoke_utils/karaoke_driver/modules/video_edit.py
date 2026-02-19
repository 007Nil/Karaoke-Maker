import logging
import os
import subprocess

logger = logging.getLogger(__name__)


def create_karaoke_video(working_dir: str) -> None:
    """Create karaoke MP4: dark background + accompaniment audio, using ffmpeg only."""
    audio_path = os.path.join(working_dir, "final.mp3")
    output_path = os.path.join(working_dir, "final.mp4")
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            # Dark navy background, no video source needed
            "-f", "lavfi", "-i", "color=c=0x0d0d2b:s=1280x720:r=25",
            "-i", audio_path,
            "-shortest",
            "-c:v", "libx264", "-preset", "fast", "-crf", "28",
            "-c:a", "aac", "-b:a", "192k",
            output_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("ffmpeg stderr:\n%s", result.stderr[-1000:])
        raise RuntimeError(f"ffmpeg failed: {result.stderr[-300:]}")
    logger.info("Karaoke video written to %s", output_path)
