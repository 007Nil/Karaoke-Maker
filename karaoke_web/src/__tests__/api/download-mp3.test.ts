import { NextRequest } from "next/server";
import { POST } from "@/app/api/download-mp3/route";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest(body?: unknown) {
  return new NextRequest("http://localhost:3000/api/download-mp3", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/download-mp3", () => {
  beforeEach(() => mockFetch.mockClear());

  it("returns 400 when video_url is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("proxies to upstream and returns job_id + file_name", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ job_id: "mp3_job_1", file_name: "My Song.mp3" }),
    });
    const res = await POST(makeRequest({ video_url: "https://youtube.com/watch?v=test" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.job_id).toBe("mp3_job_1");
    expect(data.file_name).toBe("My Song.mp3");
  });

  it("returns 502 on upstream error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "yt-dlp failed" }),
    });
    const res = await POST(makeRequest({ video_url: "https://youtube.com/watch?v=test" }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("yt-dlp failed");
  });
});
