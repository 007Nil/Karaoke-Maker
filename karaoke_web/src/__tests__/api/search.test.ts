/**
 * API route tests use Next.js route handlers directly.
 * We mock global fetch to simulate upstream Python service responses.
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/search/route";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_RESULTS = [
  {
    id: "abc123",
    title: "Test Song",
    link: "https://www.youtube.com/watch?v=abc123",
    thumbnails: [{ url: "https://i.ytimg.com/vi/abc123/hqdefault.jpg" }],
    channel: { name: "Test Channel" },
    viewCount: { short: "1M" },
    duration: "3:45",
  },
];

function makeRequest(query?: string) {
  const url = query
    ? `http://localhost:3000/api/search?query=${encodeURIComponent(query)}`
    : "http://localhost:3000/api/search";
  return new NextRequest(url);
}

describe("GET /api/search", () => {
  beforeEach(() => mockFetch.mockClear());

  it("returns 400 when query is missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it("proxies query to upstream and returns normalised results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: MOCK_RESULTS }),
    });

    const res = await GET(makeRequest("test song"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe("abc123");
    expect(data.results[0].channelName).toBe("Test Channel");
    expect(data.results[0].thumbnailUrl).toBe("https://i.ytimg.com/vi/abc123/hqdefault.jpg");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/search?query=test+song");
  });

  it("returns 502 when upstream fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ detail: "upstream error" }) });
    const res = await GET(makeRequest("test"));
    expect(res.status).toBe(502);
  });

  it("returns 500 on fetch exception", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    const res = await GET(makeRequest("test"));
    expect(res.status).toBe(500);
  });
});
