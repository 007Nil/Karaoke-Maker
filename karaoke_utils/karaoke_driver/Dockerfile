FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Install yt-dlp from GitHub master — PyPI releases lag behind YouTube's player JS changes.
RUN pip install --no-cache-dir "https://github.com/yt-dlp/yt-dlp/archive/refs/heads/master.tar.gz"

# Pre-download the demucs htdemucs model at build time so it's baked into the
# image. Without this, the first karaoke job would try to fetch ~80 MB at
# runtime, which fails if the container has no outbound internet access.
RUN python -c "from demucs.pretrained import get_model; get_model('htdemucs')"

COPY . .

EXPOSE 8003
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
