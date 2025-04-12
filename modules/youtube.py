# from pytube import YouTube
from pytubefix import YouTube
from pytubefix.cli import on_progress
import os


def get_video_title(link):
    youtubeObject = YouTube(link,on_progress_callback=on_progress)
    return youtubeObject.title

def download_youtube_video(link,tmp_dir):
    youtubeObject = YouTube(link,on_progress_callback=on_progress)
    
    youtubeObject = youtubeObject.streams.get_highest_resolution()
    try:
        youtubeObject.download(output_path=tmp_dir)
        os.system(f"cd {tmp_dir} && mv * raw.mp4")
    except:
        print("An error has occurred")
    print("Download is completed successfully")