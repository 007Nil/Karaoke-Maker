import { NextRequest, NextResponse } from "next/server";

const KARAOKE_URL = process.env.KARAOKE_URL ?? "http://localhost:8003";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const upstream = await fetch(`${KARAOKE_URL}/status/${id}`, {
      cache: "no-store",
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json({ error: data.detail ?? "Status fetch failed" }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
