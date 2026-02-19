"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { pollJobStatus, pollMp3Status } from "@/lib/api";
import type { JobStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const KARAOKE_PROGRESS: Record<JobStatus, number> = {
  queued: 5,
  downloading: 20,
  extracting: 40,
  separating: 65,
  encoding: 85,
  done: 100,
  error: 0,
};

const MP3_PROGRESS: Record<JobStatus, number> = {
  queued: 5,
  downloading: 60,
  extracting: 60,
  separating: 60,
  encoding: 60,
  done: 100,
  error: 0,
};

interface KaraokeStatusModalProps {
  jobId: string;
  videoTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "karaoke" | "mp3";
}

export function KaraokeStatusModal({
  jobId,
  videoTitle,
  open,
  onOpenChange,
  mode = "karaoke",
}: KaraokeStatusModalProps) {
  const [status, setStatus] = useState<JobStatus>("queued");
  const [message, setMessage] = useState("Job queued…");
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollFn = mode === "mp3" ? pollMp3Status : pollJobStatus;
  const progressMap = mode === "mp3" ? MP3_PROGRESS : KARAOKE_PROGRESS;
  const title = mode === "mp3" ? "MP3 Download" : "Karaoke Generation";

  useEffect(() => {
    if (!open || !jobId) return;

    // Reset on open
    setStatus("queued");
    setMessage("Job queued…");
    setError(null);

    intervalRef.current = setInterval(async () => {
      try {
        const data = await pollFn(jobId);
        setStatus(data.status);
        setMessage(data.progress_message);
        if (data.error) setError(data.error);
        if (data.status === "done" || data.status === "error") {
          clearInterval(intervalRef.current!);
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = progressMap[status];
  const isDone = status === "done";
  const isError = status === "error";
  const isRunning = !isDone && !isError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="line-clamp-1">{videoTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Progress value={progress} className={isError ? "bg-destructive/20" : undefined} />

          <div className="flex items-center gap-2 text-sm">
            {isRunning && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
            <span className={isError ? "text-destructive" : "text-muted-foreground"}>
              {isError ? error ?? "An error occurred" : message}
            </span>
          </div>

          {isDone && mode === "karaoke" && (
            <div className="flex flex-col gap-2">
              <Button className="w-full" asChild>
                <a href={`/api/download?job_id=${jobId}&type=karaoke`} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download Karaoke MP4
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href={`/api/download?job_id=${jobId}&type=karaoke-mp3`} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download Karaoke MP3
                </a>
              </Button>
            </div>
          )}

          {isDone && mode === "mp3" && (
            <Button className="w-full" asChild>
              <a href={`/api/download?job_id=${jobId}&type=mp3`} download>
                <Download className="h-4 w-4 mr-2" />
                Download MP3
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
