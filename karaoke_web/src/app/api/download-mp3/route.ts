import { NextRequest, NextResponse } from "next/server";

const MP3_DOWNLOAD_URL = process.env.MP3_DOWNLOAD_URL ?? "http://localhost:8002";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.video_url) {
    return NextResponse.json({ error: "video_url is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${MP3_DOWNLOAD_URL}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_url: body.video_url, video_title: body.video_title ?? "" }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json({ error: data.detail ?? "Download failed" }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
