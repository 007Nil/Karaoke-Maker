import { NextRequest, NextResponse } from "next/server";

const KARAOKE_URL = process.env.KARAOKE_URL ?? "http://localhost:8003";
const MP3_DOWNLOAD_URL = process.env.MP3_DOWNLOAD_URL ?? "http://localhost:8002";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const jobId = searchParams.get("job_id");

  if (!type || !jobId) {
    return NextResponse.json({ error: "type and job_id are required" }, { status: 400 });
  }

  let upstreamUrl: string;
  if (type === "karaoke") {
    upstreamUrl = `${KARAOKE_URL}/file/${jobId}`;
  } else if (type === "karaoke-mp3") {
    upstreamUrl = `${KARAOKE_URL}/mp3/${jobId}`;
  } else {
    upstreamUrl = `${MP3_DOWNLOAD_URL}/file/${jobId}`;
  }

  try {
    const upstream = await fetch(upstreamUrl, { cache: "no-store" });
    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail ?? "File not available" }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const ext = type === "karaoke" ? "mp4" : "mp3";
    const contentDisposition = upstream.headers.get("content-disposition") ?? `attachment; filename="${jobId}.${ext}"`;

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
