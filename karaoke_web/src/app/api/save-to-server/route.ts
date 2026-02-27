import { NextRequest, NextResponse } from "next/server";

const KARAOKE_URL = process.env.KARAOKE_URL ?? "http://localhost:8003";
const MP3_DOWNLOAD_URL = process.env.MP3_DOWNLOAD_URL ?? "http://localhost:8002";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.job_id || !body?.type || body?.sub_path === undefined) {
    return NextResponse.json({ error: "Missing job_id, type, or sub_path" }, { status: 400 });
  }

  const { job_id, type, sub_path } = body as {
    job_id: string;
    type: "karaoke" | "karaoke-mp3" | "mp3";
    sub_path: string;
  };

  let upstreamUrl: string;
  let upstreamBody: Record<string, string>;

  if (type === "karaoke") {
    upstreamUrl = `${KARAOKE_URL}/save/${job_id}`;
    upstreamBody = { sub_path, file_type: "mp4" };
  } else if (type === "karaoke-mp3") {
    upstreamUrl = `${KARAOKE_URL}/save/${job_id}`;
    upstreamBody = { sub_path, file_type: "mp3" };
  } else {
    upstreamUrl = `${MP3_DOWNLOAD_URL}/save/${job_id}`;
    upstreamBody = { sub_path };
  }

  try {
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamBody),
    });

    const data = await res.json().catch(() => ({ error: "Invalid response from service" }));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail ?? data.error ?? "Save failed" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not reach service" }, { status: 502 });
  }
}
