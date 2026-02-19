import { NextRequest, NextResponse } from "next/server";

const KARAOKE_URL = process.env.KARAOKE_URL ?? "http://localhost:8003";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.video_url) {
    return NextResponse.json({ error: "video_url is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${KARAOKE_URL}/karaoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_url: body.video_url }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json({ error: data.detail ?? "Karaoke job failed" }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
