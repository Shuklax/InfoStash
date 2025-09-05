"use client";

import { useEffect, useRef } from "react";

import { useState } from "react";
import { Input } from "./ui/input";
import { Command } from "lucide-react";

export default function Header() {
  const [hasData, setHasData] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          /> <span className="inline-flex opacity-50 ml-3 self-center">ctrl+k / <Command className="size-4 self-center"/>k</span>
        </div>
        <div className="mr-10 font-sans font-semibold">
          {hasData ? "Dataset Loaded" : "No Dataset Loaded"}
        </div>
      </div>
    </header>
  );
}
