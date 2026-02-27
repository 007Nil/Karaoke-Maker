import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    karaokeEnabled: process.env.KARAOKE_ENABLED !== "false",
    outputDir: process.env.OUTPUT_DIR ?? null,
  });
}
