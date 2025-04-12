import os
import argparse
import tempfile

# Custom modules
import modules.youtube as ytube
import modules.video_edit as ve
import modules.vocal_remover as vr
import modules.utils as utils



def main():
    parser = argparse.ArgumentParser(description="Remove vocals from an audio file.")
    parser.add_argument("--youtube-link",required=True ,help="Path to the input audio file")
    parser.add_argument("--music-video",required=False,action="store_true", help="If this is passed then video file will be generated")
    parser.add_argument("--destination",required=True,help="Destination Dir name")

    
    args = parser.parse_args()

    tmp_dir = tempfile.TemporaryDirectory()
    format="mp3"
    video_title = ytube.get_video_title(args.youtube_link)
    ytube.download_youtube_video(args.youtube_link,tmp_dir.name)
    ve.extract_audio_from_video(tmp_dir.name)
    vr.remove_vocals(tmp_dir.name)
    utils.copy_accompaniment_file(tmp_dir.name)
    utils.convert_wav_to_mp3(tmp_dir.name)
    if args.music_video:
        ve.add_audio_to_video(tmp_dir.name)
        format="mp4"
    utils.rename_final_file(tmp_dir.name,video_title,args.destination,format)
    tmp_dir.cleanup()

if __name__ == "__main__":
    main()