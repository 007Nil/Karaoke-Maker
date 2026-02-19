"use client";

import YouTube from "react-youtube";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoPlayerModalProps {
  videoId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPlayerModal({ videoId, title, open, onOpenChange }: VideoPlayerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-sm font-medium line-clamp-2">{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full">
          <YouTube
            videoId={videoId}
            opts={{ width: "100%", height: "100%", playerVars: { autoplay: 1 } }}
            className="w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
