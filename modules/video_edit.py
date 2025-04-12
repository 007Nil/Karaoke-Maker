from moviepy.editor import VideoFileClip, AudioFileClip


def extract_audio_from_video(video_path):
    video_clip = VideoFileClip(video_path+"/raw.mp4")
    audio_clip = video_clip.audio

    audio_clip.write_audiofile(video_path+"/original.mp3", codec='mp3')
    video_clip.close()
    print(f"Audio extracted successfully.")

def add_audio_to_video(working_dir):
    # Load video clip
    video_clip = VideoFileClip(working_dir+"/raw.mp4")

    # Load audio clip
    audio_clip = AudioFileClip(working_dir+"/final.mp3")

    # Set the audio of the video clip to the loaded audio clip
    video_clip = video_clip.set_audio(audio_clip)

    # Write the result to a new file
    video_clip.write_videofile(working_dir+"/final.mp4", codec="libx264", audio_codec="mp3")