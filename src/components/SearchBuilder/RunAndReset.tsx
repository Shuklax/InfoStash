"use client";

import { useSearchStore } from "../../store/searchStore";
import { Button } from "../ui/button";

export function RunAndReset() {
  const reset = useSearchStore((state) => state.reset);
  const searchState = useSearchStore((state) => state);

  const handleRunSearch = async () => {
    try {
      // Call the search API with the current search state
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchState),
      });

      if (!response.ok) throw new Error("Search API failed");
      const result = await response.json();

      console.log("Search Results:", result);
      useSearchStore.getState().setResults(result.data ?? []); // push into store

      // Save to localStorage for internal searches
      const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      history.push({
        searchObject: searchState,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("searchHistory", JSON.stringify(history));
    } catch (err) {
      console.error("Error running search:", err);
    }
  };

  return (
    <div className="flex my-4 justify-evenly">
      <Button className="font-sans font-semibold" onClick={handleRunSearch}>
        Run Search
      </Button>
      <Button variant="outline" className="font-semibold" onClick={reset}>
        Reset Filters
      </Button>
    </div>
  );
}
