from fastapi import FastAPI, HTTPException, Query
import yt_dlp

app = FastAPI(title="YouTube Search Service")


@app.get("/search")
def search(query: str = Query(..., min_length=1)):
    try:
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch20:{query}", download=False)
            entries = info.get("entries", []) if info else []

        results = []
        for entry in entries:
            if not entry:
                continue

            video_id = entry.get("id", "")
            thumbnails = entry.get("thumbnails") or [
                {"url": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"}
            ]

            view_count = entry.get("view_count")
            if view_count is None:
                view_count_short = ""
            elif view_count >= 1_000_000:
                view_count_short = f"{view_count / 1_000_000:.1f}M"
            elif view_count >= 1_000:
                view_count_short = f"{view_count / 1_000:.1f}K"
            else:
                view_count_short = str(view_count)

            results.append({
                "id": video_id,
                "title": entry.get("title", ""),
                "link": f"https://www.youtube.com/watch?v={video_id}",
                "thumbnails": thumbnails,
                "channel": {"name": entry.get("channel") or entry.get("uploader", "")},
                "viewCount": {"short": view_count_short},
                "duration": entry.get("duration_string", ""),
            })

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
