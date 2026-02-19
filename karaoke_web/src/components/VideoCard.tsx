"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Music, Play } from "lucide-react";
import { startKaraoke, startMp3Download } from "@/lib/api";
import type { VideoResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { KaraokeStatusModal } from "./KaraokeStatusModal";
import { VideoPlayerModal } from "./VideoPlayerModal";

interface VideoCardProps {
  video: VideoResult;
}

export function VideoCard({ video }: VideoCardProps) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const [karaokeJobId, setKaraokeJobId] = useState<string | null>(null);
  const [karaokeOpen, setKaraokeOpen] = useState(false);
  const [mp3JobId, setMp3JobId] = useState<string | null>(null);
  const [mp3Open, setMp3Open] = useState(false);
  const [mp3Loading, setMp3Loading] = useState(false);

  async function handleMp3() {
    setMp3Loading(true);
    try {
      const { job_id } = await startMp3Download(video.link);
      setMp3JobId(job_id);
      setMp3Open(true);
    } catch (err) {
      console.error("MP3 download failed to start", err);
    } finally {
      setMp3Loading(false);
    }
  }

  async function handleKaraoke() {
    try {
      const { job_id } = await startKaraoke(video.link);
      setKaraokeJobId(job_id);
      setKaraokeOpen(true);
    } catch (err) {
      console.error("Karaoke job failed to start", err);
    }
  }

  return (
    <>
      <Card className="flex flex-col overflow-hidden h-full transition-shadow hover:shadow-lg hover:shadow-primary/10">
        {/* Thumbnail */}
        <div
          className="relative aspect-video w-full cursor-pointer group"
          onClick={() => setPlayerOpen(true)}
          role="button"
          aria-label={`Play ${video.title}`}
        >
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
          {video.duration && (
            <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5">
              {video.duration}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 pt-3">
          <h3
            className="text-sm font-semibold leading-snug line-clamp-2 mb-1"
            title={video.title}
          >
            {video.title}
          </h3>
          {video.channelName && (
            <p className="text-xs text-muted-foreground truncate">{video.channelName}</p>
          )}
          {video.viewCount && (
            <p className="text-xs text-muted-foreground mt-0.5">{video.viewCount}</p>
          )}
        </CardContent>

        {/* Actions */}
        <CardFooter className="gap-2 flex-wrap pt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setPlayerOpen(true)}
          >
            <Play className="h-3.5 w-3.5" />
            Stream
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleMp3}
            disabled={mp3Loading}
          >
            <Download className="h-3.5 w-3.5" />
            {mp3Loading ? "…" : "MP3"}
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleKaraoke}
          >
            <Music className="h-3.5 w-3.5" />
            Karaoke
          </Button>
        </CardFooter>
      </Card>

      <VideoPlayerModal
        videoId={video.id}
        title={video.title}
        open={playerOpen}
        onOpenChange={setPlayerOpen}
      />

      {mp3JobId && (
        <KaraokeStatusModal
          jobId={mp3JobId}
          videoTitle={video.title}
          open={mp3Open}
          onOpenChange={setMp3Open}
          mode="mp3"
        />
      )}

      {karaokeJobId && (
        <KaraokeStatusModal
          jobId={karaokeJobId}
          videoTitle={video.title}
          open={karaokeOpen}
          onOpenChange={setKaraokeOpen}
        />
      )}
    </>
  );
}
