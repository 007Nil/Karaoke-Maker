import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VideoCard } from "@/components/VideoCard";
import type { VideoResult } from "@/lib/types";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

// Mock react-youtube
jest.mock("react-youtube", () => ({
  __esModule: true,
  default: () => <div data-testid="youtube-player" />,
}));

// Mock api functions
jest.mock("@/lib/api", () => ({
  startMp3Download: jest.fn(),
  startKaraoke: jest.fn(),
}));

import { startMp3Download, startKaraoke } from "@/lib/api";

const mockVideo: VideoResult = {
  id: "abc123",
  title: "Test Song Title",
  link: "https://www.youtube.com/watch?v=abc123",
  thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
  channelName: "Test Channel",
  viewCount: "1M views",
  duration: "3:45",
};

describe("VideoCard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders video title, channel and duration", () => {
    render(<VideoCard video={mockVideo} />);
    expect(screen.getByText("Test Song Title")).toBeInTheDocument();
    expect(screen.getByText("Test Channel")).toBeInTheDocument();
    expect(screen.getByText("3:45")).toBeInTheDocument();
  });

  it("renders Stream, MP3 and Karaoke buttons", () => {
    render(<VideoCard video={mockVideo} />);
    expect(screen.getAllByRole("button", { name: /stream/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /mp3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /karaoke/i })).toBeInTheDocument();
  });

  it("calls startMp3Download when MP3 button clicked", async () => {
    (startMp3Download as jest.Mock).mockResolvedValue({ job_id: "mp3_job_1", file_name: "song.mp3" });
    const originalHref = window.location.href;
    render(<VideoCard video={mockVideo} />);
    fireEvent.click(screen.getByRole("button", { name: /mp3/i }));
    await waitFor(() => {
      expect(startMp3Download).toHaveBeenCalledWith(mockVideo.link);
    });
  });

  it("calls startKaraoke and opens modal when Karaoke button clicked", async () => {
    (startKaraoke as jest.Mock).mockResolvedValue({ job_id: "kar_job_1" });
    render(<VideoCard video={mockVideo} />);
    fireEvent.click(screen.getByRole("button", { name: /karaoke/i }));
    await waitFor(() => {
      expect(startKaraoke).toHaveBeenCalledWith(mockVideo.link);
      expect(screen.getByText(/karaoke generation/i)).toBeInTheDocument();
    });
  });

  it("shows YouTube player modal when Stream button clicked", () => {
    render(<VideoCard video={mockVideo} />);
    fireEvent.click(screen.getAllByRole("button", { name: /stream/i })[0]);
    expect(screen.getByTestId("youtube-player")).toBeInTheDocument();
  });
});
