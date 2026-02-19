import os
import subprocess
import sys

# yt-dlp -f "bestaudio/best" -ciw -o "%(title)s.%(ext)s" -v --extract-audio --audio-quality 0 --audio-format mp3  https://www.youtube.com/watch?v=lRVJuPI5IXI


video_title = sys.argv[1]
tmp_dir = sys.argv[2]
os.system(f"/home/nil/Projects/personal/Karaoke-Maker/karaoke_utils/donwload-mp3/.env/bin/yt-dlp -f 'bestaudio/best' -ciw -o {tmp_dir}/'%(title)s.%(ext)s' --extract-audio --audio-quality 0 --audio-format mp3 {video_title} > /dev/null")
for root, dirs, files in os.walk(os.path.abspath(tmp_dir)):
    for file in files:
        print(os.path.join(root, file))