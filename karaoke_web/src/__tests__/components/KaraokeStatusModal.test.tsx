import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { KaraokeStatusModal } from "@/components/KaraokeStatusModal";

jest.mock("@/lib/api", () => ({
  pollJobStatus: jest.fn(),
}));

import { pollJobStatus } from "@/lib/api";

describe("KaraokeStatusModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    jobId: "job123",
    videoTitle: "Test Song",
    open: true,
    onOpenChange: jest.fn(),
  };

  it("renders modal with job title", () => {
    (pollJobStatus as jest.Mock).mockResolvedValue({
      job_id: "job123",
      status: "queued",
      progress_message: "Job queued",
      error: null,
    });
    render(<KaraokeStatusModal {...defaultProps} />);
    expect(screen.getByText(/karaoke generation/i)).toBeInTheDocument();
    expect(screen.getByText("Test Song")).toBeInTheDocument();
  });

  it("polls job status at interval and shows progress message", async () => {
    (pollJobStatus as jest.Mock).mockResolvedValue({
      job_id: "job123",
      status: "separating",
      progress_message: "Removing vocals (this takes a while)…",
      error: null,
    });

    render(<KaraokeStatusModal {...defaultProps} />);
    await act(async () => {
      jest.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(pollJobStatus).toHaveBeenCalledWith("job123");
      expect(screen.getByText(/removing vocals/i)).toBeInTheDocument();
    });
  });

  it("shows download button when status is done", async () => {
    (pollJobStatus as jest.Mock).mockResolvedValue({
      job_id: "job123",
      status: "done",
      progress_message: "Karaoke video ready",
      error: null,
    });

    render(<KaraokeStatusModal {...defaultProps} />);
    await act(async () => {
      jest.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(screen.getByText(/download karaoke/i)).toBeInTheDocument();
    });
  });

  it("shows error message when status is error", async () => {
    (pollJobStatus as jest.Mock).mockResolvedValue({
      job_id: "job123",
      status: "error",
      progress_message: "Processing failed",
      error: "ffmpeg failed: codec error",
    });

    render(<KaraokeStatusModal {...defaultProps} />);
    await act(async () => {
      jest.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(screen.getByText(/ffmpeg failed/i)).toBeInTheDocument();
    });
  });

  it("does not poll when modal is closed", () => {
    (pollJobStatus as jest.Mock).mockResolvedValue({
      job_id: "job123",
      status: "queued",
      progress_message: "Queued",
      error: null,
    });
    render(<KaraokeStatusModal {...defaultProps} open={false} />);
    act(() => { jest.advanceTimersByTime(10000); });
    expect(pollJobStatus).not.toHaveBeenCalled();
  });
});
