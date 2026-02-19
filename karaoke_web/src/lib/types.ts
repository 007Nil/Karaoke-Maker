export interface VideoResult {
  id: string;
  title: string;
  link: string;
  thumbnailUrl: string;
  channelName: string;
  viewCount: string;
  duration: string;
}

export type JobStatus =
  | "queued"
  | "downloading"
  | "extracting"
  | "separating"
  | "encoding"
  | "done"
  | "error";

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress_message: string;
  error: string | null;
}
