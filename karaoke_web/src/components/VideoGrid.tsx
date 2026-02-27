"use client";

import type { VideoResult } from "@/lib/types";
import { VideoCard } from "./VideoCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 12;

interface VideoGridProps {
  videos: VideoResult[];
  page: number;
  onPageChange: (page: number) => void;
  karaokeEnabled?: boolean;
}

// Skeleton card shown while loading
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="h-8 bg-muted rounded flex-1" />
        <div className="h-8 bg-muted rounded flex-1" />
        <div className="h-8 bg-muted rounded flex-1" />
      </div>
    </div>
  );
}

export function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function VideoGrid({ videos, page, onPageChange, karaokeEnabled = true }: VideoGridProps) {
  const totalPages = Math.ceil(videos.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageVideos = videos.slice(start, start + PAGE_SIZE);

  if (videos.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pageVideos.map((v) => (
          <VideoCard key={v.id} video={v} karaokeEnabled={karaokeEnabled} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
