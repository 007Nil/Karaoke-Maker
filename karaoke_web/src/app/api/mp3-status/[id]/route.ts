import { NextRequest, NextResponse } from "next/server";

const MP3_DOWNLOAD_URL = process.env.MP3_DOWNLOAD_URL ?? "http://localhost:8002";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const upstream = await fetch(`${MP3_DOWNLOAD_URL}/status/${id}`, {
      cache: "no-store",
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
