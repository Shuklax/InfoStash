"use client";

import { useEffect, useRef } from "react";

import { useState } from "react";
import { Input } from "./ui/input";
import { Command } from "lucide-react";
import { Button } from "./ui/button";
import { useSearchHistoryStore, useSearchStore } from "@/store/searchStore";

export default function Header() {
  const historySheetOpen = useSearchHistoryStore(
    (state) => state.historySheetOpen
  );
  const setHistorySheetOpen = useSearchHistoryStore(
    (state) => state.setHistorySheetOpen
  );

  const [hasData, setHasData] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setFiltersFromLLM = useSearchStore((s) => s.setFiltersFromLLM);
  const setResults = useSearchStore((s) => s.setResults);

  useEffect(() => {
    const checkStatus = () => {
      fetch("/api/db-status")
        .then((r) => r.json())
        .then((data) => setHasData(data.hasData));
    };

    // Check immediately
    checkStatus();

    // Poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    // Add event listener to document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputRef.current?.value) {
      const text = inputRef.current.value;

      // 1. Send to llm parser
      const res = await fetch("/api/llm-parse", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      const parsed = await res.json();

      // 2. Store filters in global store
      setFiltersFromLLM(parsed);

      // 3. Immediately trigger search
      const searchRes = await fetch("/api/search", {
        method: "POST",
        body: JSON.stringify({ searchObject: parsed }),
      });
      const jsonData = await searchRes.json();

      // normalize
      const rows = Array.isArray(jsonData) ? jsonData : jsonData.data ?? [];

      useSearchStore.getState().setResults(rows);
    }
  };

  return (
    <header>
      <div className="flex justify-between items-center p-3 border">
        <div className="text-[20px] font-bold font-sans text-xl underline italic">
          InfoStash
        </div>
        <div className="flex justify-center w-96">
          <Input
            ref={inputRef}
            placeholder="Search companies, domains or technologies"
            className="w-64"
            onKeyDown={handleKeyDown}
          />{" "}
          <span className="inline-flex opacity-50 ml-3 self-center">
            ctrl+k / <Command className="size-4 self-center" />k
          </span>
        </div>
        <div className="mr-10 font-sans font-semibold">
          {hasData ? "Dataset Loaded" : "No Dataset Loaded"}
        </div>
        <div>
          <Button
            variant="outline"
            className="mr-4 font-semibold border-2"
            onClick={() => setHistorySheetOpen(!historySheetOpen)}
          >
            Search History
          </Button>
        </div>
      </div>
    </header>
  );
}
