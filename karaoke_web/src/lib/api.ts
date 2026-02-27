import type { JobStatusResponse, VideoResult } from "./types";

export async function searchVideos(query: string): Promise<VideoResult[]> {
  const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.results as VideoResult[];
}

export async function startMp3Download(videoUrl: string, videoTitle?: string): Promise<{ job_id: string }> {
  const res = await fetch("/api/download-mp3", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_url: videoUrl, video_title: videoTitle ?? "" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "MP3 download failed");
  }
  return res.json();
}

export async function startKaraoke(videoUrl: string): Promise<{ job_id: string }> {
  const res = await fetch("/api/karaoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_url: videoUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Karaoke job failed to start");
  }
  return res.json();
}

export async function pollJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`/api/job/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch job status");
  return res.json();
}

export async function pollMp3Status(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`/api/mp3-status/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch MP3 job status");
  return res.json();
}

export async function getConfig(): Promise<{ karaokeEnabled: boolean; outputDir: string | null }> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Failed to fetch config");
  return res.json();
}

export async function saveToServer(
  jobId: string,
  type: "karaoke" | "karaoke-mp3" | "mp3",
  subPath: string,
): Promise<{ saved_to: string }> {
  const res = await fetch("/api/save-to-server", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, type, sub_path: subPath }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Save to server failed");
  }
  return res.json();
}
