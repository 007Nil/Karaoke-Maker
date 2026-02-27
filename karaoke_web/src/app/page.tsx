"use client";

import { useEffect, useState } from "react";
import { Music2 } from "lucide-react";
import { getConfig, searchVideos } from "@/lib/api";
import type { VideoResult } from "@/lib/types";
import { SearchBar } from "@/components/SearchBar";
import { VideoGrid, VideoGridSkeleton } from "@/components/VideoGrid";

export default function HomePage() {
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [karaokeEnabled, setKaraokeEnabled] = useState(true);

  useEffect(() => {
    getConfig().then((cfg) => setKaraokeEnabled(cfg.karaokeEnabled)).catch(() => {});
  }, []);

  async function handleSearch(query: string) {
    setLoading(true);
    setError(null);
    setPage(1);
    setHasSearched(true);
    try {
      const results = await searchVideos(query);
      setVideos(results);
    } catch {
      setError("Search failed. Please try again.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Music2 className="h-6 w-6 text-primary shrink-0" />
          <span className="font-bold text-lg tracking-tight">Karaoke Maker</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero + search */}
        {!hasSearched && (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-2xl p-4">
                <Music2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Make Any Song a Karaoke Track
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Search YouTube, download MP3s, or generate karaoke versions with AI vocal removal.
            </p>
          </div>
        )}

        {/* Search bar */}
        <div className="flex justify-center">
          <SearchBar onSearch={handleSearch} isLoading={loading} />
        </div>

        {/* Results */}
        {error && (
          <p className="text-center text-destructive text-sm">{error}</p>
        )}

        {loading && <VideoGridSkeleton />}

        {!loading && hasSearched && videos.length === 0 && !error && (
          <p className="text-center text-muted-foreground">No results found.</p>
        )}

        {!loading && videos.length > 0 && (
          <VideoGrid videos={videos} page={page} onPageChange={setPage} karaokeEnabled={karaokeEnabled} />
        )}
      </div>
    </main>
  );
}
