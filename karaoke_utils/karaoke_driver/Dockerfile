FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Install yt-dlp from GitHub master — PyPI releases lag behind YouTube's player JS changes.
RUN pip install --no-cache-dir "https://github.com/yt-dlp/yt-dlp/archive/refs/heads/master.tar.gz"

COPY . .

EXPOSE 8003
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
