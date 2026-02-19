import logging
import os
import shutil
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)


def remove_vocals(working_dir: str) -> None:
    audio_input = os.path.abspath(os.path.join(working_dir, "original.mp3"))
    stems_dir = os.path.join(working_dir, "stems")

    result = subprocess.run(
        [
            "demucs",
            "--two-stems=vocals",
            "-o", stems_dir,
            audio_input,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("demucs stderr:\n%s", result.stderr[-2000:])
        raise RuntimeError(f"demucs failed: {result.stderr[-500:]}")

    # demucs outputs: stems/<model>/original/no_vocals.wav
    no_vocals = next(Path(stems_dir).glob("*/original/no_vocals.wav"), None)
    if not no_vocals:
        raise RuntimeError(
            f"demucs: no_vocals.wav not found under {stems_dir}. "
            f"Contents: {list(Path(stems_dir).rglob('*.wav'))}"
        )

    # Place at working_dir/original/accompaniment.wav — where the rest of the pipeline expects it
    out_dir = os.path.join(working_dir, "original")
    os.makedirs(out_dir, exist_ok=True)
    shutil.copy2(str(no_vocals), os.path.join(out_dir, "accompaniment.wav"))
    logger.info("Vocal separation complete, accompaniment at %s/original/accompaniment.wav", working_dir)
