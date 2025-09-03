"use client"

import { useSearchStore } from "../../store/searchStore";
import { Button } from "../ui/button";

export function RunAndReset() {
  const reset = useSearchStore((state) => state.reset);

  return (
    <>
      <div className="flex my-4 justify-evenly">
        <Button className="font-sans font-semibold">Run Search</Button>
        <Button variant="outline" className="font-semibold" onClick={reset}>
          Reset Filters
        </Button>
      </div>
    </>
  );
}
