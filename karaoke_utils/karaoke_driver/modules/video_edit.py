import logging
import os
import subprocess

logger = logging.getLogger(__name__)


def create_karaoke_video(working_dir: str) -> None:
    """Create karaoke MP4: original video with vocals-removed audio track."""
    video_path = os.path.join(working_dir, "raw.mp4")
    audio_path = os.path.join(working_dir, "final.mp3")
    output_path = os.path.join(working_dir, "final.mp4")
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", video_path,          # original video (has video + audio streams)
            "-i", audio_path,          # instrumental audio
            "-map", "0:v:0",           # take video stream from raw.mp4
            "-map", "1:a:0",           # take audio from instrumental
            "-c:v", "copy",            # copy video stream — no re-encode, fast
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            output_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("ffmpeg stderr:\n%s", result.stderr[-1000:])
        raise RuntimeError(f"ffmpeg failed: {result.stderr[-300:]}")
    logger.info("Karaoke video written to %s", output_path)
