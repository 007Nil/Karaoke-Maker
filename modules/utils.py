import subprocess
import os

def copy_accompaniment_file(working_dir):
    subprocess.getoutput("cp -rp "+working_dir+"/original/accompaniment.wav "+working_dir+"/")


def convert_wav_to_mp3(working_dir):
    subprocess.getoutput("ffmpeg -i "+working_dir+"/accompaniment.wav -vn -ar 44100 -ac 2 -b:a 192k "+working_dir+"/final.mp3")

def rename_final_video(working_dir,org_name,dest):
    os.system("cp -rp "+working_dir+"/final.mp3 "+dest+"/"+org_name+".mp3")
    # os.replace(working_dir+"/final.mp4", dest+"/"+org_name)