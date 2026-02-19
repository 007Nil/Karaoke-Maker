import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/SearchBar";

describe("SearchBar", () => {
  it("renders input and search button", () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByPlaceholderText(/search youtube/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("calls onSearch with trimmed query when button is clicked", async () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/search youtube/i);
    await userEvent.type(input, "  bohemian rhapsody  ");
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(onSearch).toHaveBeenCalledWith("bohemian rhapsody");
  });

  it("calls onSearch when Enter is pressed", async () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/search youtube/i);
    await userEvent.type(input, "test song{Enter}");
    expect(onSearch).toHaveBeenCalledWith("test song");
  });

  it("does not call onSearch for empty input", async () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("disables input and button while loading", () => {
    render(<SearchBar onSearch={jest.fn()} isLoading />);
    expect(screen.getByPlaceholderText(/search youtube/i)).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
