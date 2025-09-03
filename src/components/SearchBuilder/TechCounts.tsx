"use client";

import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { useSearchStore } from "../../store/searchStore";

export function TechCounts() {
  // const globalFilters = useSearchStore((s) => s.numberFilter);
  // useEffect(() => {
  //   setCounts([
  //     globalFilters.totalTechnologies,
  //     globalFilters.technologiesPerCategory,
  //   ]);
  // }, [globalFilters]);

  // local array: [totalTechnologies, technologiesPerCategory]
  const [counts, setCounts] = useState<number[]>([0, 0]);

  // global setter
  const setNumberFilter = useSearchStore((state) => state.setNumberFilter);

  // sync to zustand whenever counts change
  useEffect(() => {
    setNumberFilter({
      totalTechnologies: counts[0],
      technologiesPerCategory: counts[1],
    });
  }, [counts, setNumberFilter]);

  const handleChange = (index: number, value: string) => {
    const parsed = parseFloat(value);
    setCounts((prev) => {
      const updated = [...prev];
      updated[index] = isNaN(parsed) || parsed < 0 ? 0 : parsed;
      return updated;
    });
  };

  return (
    <div className="flex justify-around font-sans my-5 gap-4">
      <div className="text-center">
        <label className="font-semibold mb-1 block">Total Technologies</label>
        <Input
          type="number"
          min={0}
          className="font-sans w-20"
          value={counts[0]}
          onKeyDown={(e) => {
            if (["-", "e", "E", "+"].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onChange={(e) => handleChange(0, e.target.value)}
        />
      </div>

      <div className="text-center">
        <label className="font-semibold mb-1 block">
          Technologies per Category
        </label>
        <Input
          type="number"
          min={0}
          className="font-sans w-20"
          value={counts[1]}
          onKeyDown={(e) => {
            if (["-", "e", "E", "+"].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onChange={(e) => handleChange(1, e.target.value)}
        />
      </div>
    </div>
  );
}
