import os
import warnings
from spleeter.separator import Separator


def remove_vocals(working_dir):
    warnings.filterwarnings('ignore')
    separator = Separator('spleeter:2stems')
    audio_input = os.path.abspath(working_dir+"/original.mp3")
    audio_output = os.path.abspath(working_dir+"/")

    # Separating vocals and accompaniment
    separator.separate_to_file(audio_input, audio_output)

    print(f"Vocals removed successfully. Result saved to: {audio_output}")