"use client";

import { useState, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");

  function handleSubmit() {
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="flex w-full max-w-2xl gap-2">
      <Input
        placeholder="Search YouTube videos…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="h-11 text-base"
        aria-label="Search query"
      />
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !query.trim()}
        size="lg"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        {isLoading ? "Searching…" : "Search"}
      </Button>
    </div>
  );
}
