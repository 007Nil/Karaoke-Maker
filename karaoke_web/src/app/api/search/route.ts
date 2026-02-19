import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_SEARCH_URL = process.env.YOUTUBE_SEARCH_URL ?? "http://localhost:8001";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${YOUTUBE_SEARCH_URL}/search?query=${encodeURIComponent(query)}`,
      { cache: "no-store" }
    );
    if (!upstream.ok) {
      return NextResponse.json({ error: "Search service error" }, { status: 502 });
    }

    const data = await upstream.json();

    // Normalise raw youtubesearchpython result shape into VideoResult[]
    const results = (data.results ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      link: r.link,
      thumbnailUrl: ((r.thumbnails as Array<{ url: string }>) ?? []).at(-1)?.url ?? "",
      channelName: (r.channel as { name?: string } | undefined)?.name ?? "",
      viewCount: (r.viewCount as { short?: string } | undefined)?.short ?? "",
      duration: r.duration ?? "",
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
