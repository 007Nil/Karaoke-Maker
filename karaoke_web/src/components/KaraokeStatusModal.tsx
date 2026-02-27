"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, Loader2, Save, X } from "lucide-react";
import { pollJobStatus, pollMp3Status, saveToServer } from "@/lib/api";
import type { JobStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Inline save-to-server form for a single file type
function SaveToServerForm({
  jobId,
  type,
}: {
  jobId: string;
  type: "karaoke" | "karaoke-mp3" | "mp3";
}) {
  const [subPath, setSubPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedTo(null);
    setSaveError(null);
    try {
      const result = await saveToServer(jobId, type, subPath);
      setSavedTo(result.saved_to);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (savedTo) {
    return (
      <div className="flex items-start gap-2 text-sm text-green-500 bg-green-500/10 rounded-md p-2">
        <Check className="h-4 w-4 shrink-0 mt-0.5" />
        <span className="break-all font-mono text-xs">Saved to: {savedTo}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">
        Sub-folder within the server output directory (leave blank to save in root):
      </p>
      <div className="flex items-center gap-1">
        <Input
          className="h-7 text-xs font-mono"
          placeholder="e.g. karaoke-songs/"
          value={subPath}
          onChange={(e) => setSubPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !saving && handleSave()}
        />
        <Button size="sm" className="h-7 px-2 shrink-0" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {saveError && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <X className="h-3.5 w-3.5 shrink-0" />
          {saveError}
        </div>
      )}
    </div>
  );
}

// One downloadable file row: download to computer + save to server
function DownloadRow({
  label,
  href,
  jobId,
  type,
  variant = "default",
}: {
  label: string;
  href: string;
  jobId: string;
  type: "karaoke" | "karaoke-mp3" | "mp3";
  variant?: "default" | "outline";
}) {
  const [showSave, setShowSave] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button className="flex-1" variant={variant} asChild>
          <a href={href} download>
            <Download className="h-4 w-4 mr-2" />
            {label}
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setShowSave((v) => !v)}
          title="Save to server path"
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
      </div>
      {showSave && <SaveToServerForm jobId={jobId} type={type} />}
    </div>
  );
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
            <div className="flex flex-col gap-3">
              <DownloadRow
                label="Download Karaoke MP4"
                href={`/api/download?job_id=${jobId}&type=karaoke`}
                jobId={jobId}
                type="karaoke"
              />
              <DownloadRow
                label="Download Karaoke MP3"
                href={`/api/download?job_id=${jobId}&type=karaoke-mp3`}
                jobId={jobId}
                type="karaoke-mp3"
                variant="outline"
              />
            </div>
          )}

          {isDone && mode === "mp3" && (
            <DownloadRow
              label="Download MP3"
              href={`/api/download?job_id=${jobId}&type=mp3`}
              jobId={jobId}
              type="mp3"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
