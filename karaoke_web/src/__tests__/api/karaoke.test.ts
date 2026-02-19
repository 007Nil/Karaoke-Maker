import { NextRequest } from "next/server";
import { POST } from "@/app/api/karaoke/route";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest(body?: unknown) {
  return new NextRequest("http://localhost:3000/api/karaoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/karaoke", () => {
  beforeEach(() => mockFetch.mockClear());

  it("returns 400 when video_url is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns job_id on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ job_id: "abc123" }),
    });
    const res = await POST(makeRequest({ video_url: "https://youtube.com/watch?v=test" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.job_id).toBe("abc123");
  });

  it("returns 502 when upstream fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "service error" }),
    });
    const res = await POST(makeRequest({ video_url: "https://youtube.com/watch?v=test" }));
    expect(res.status).toBe(502);
  });

  it("returns 500 on network exception", async () => {
    mockFetch.mockRejectedValue(new Error("timeout"));
    const res = await POST(makeRequest({ video_url: "https://youtube.com/watch?v=test" }));
    expect(res.status).toBe(500);
  });
});
