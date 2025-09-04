"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { ComboboxInput } from "./ComboboxInput";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchStore } from "@/store/searchStore";
import classNames from "classnames";

type FilterState = {
  and: string[];
  or: string[];
  none: string[];
  removeDuplicates: boolean;
  filteringType: "together" | "individual";
};

export function TechnologyFilters() {
  // const globalFilters = useSearchStore((s) => s.technologyFilter);
  // useEffect(() => {
  //   // whenever global changes (including reset), reflect it locally
  //   setFilters(globalFilters);
  // }, [globalFilters]);

  const [technologies, setTechnologies] = useState<
    { value: string; label: string }[]
  >([]);

  //global setter
  const setTechnologyFilter = useSearchStore(
    (state) => state.setTechnologyFilter
  );

  const [filters, setFilters] = useState<FilterState>({
    and: [],
    or: [],
    none: [],
    removeDuplicates: false,
    filteringType: "together",
  });
  const [activeCondition, setActiveCondition] = useState<
    "and" | "or" | "none" | null
  >(null);

  useEffect(() => {
    fetch("/api/technologies")
      .then((res) => res.json())
      .then((data) => setTechnologies(data));
  }, []);

  //sync the local filters to global state
  useEffect(() => {
    setTechnologyFilter(filters);
  }, [filters, setTechnologyFilter]);

  const handleAddTech = (tech: string) => {
    if (!activeCondition || !tech.trim()) return; // guard clause

    const inAndOr = filters.and.includes(tech) || filters.or.includes(tech);
    const inNone = filters.none.includes(tech);

    // Rule: can't add to "none" if already in "and" or "or"
    if (activeCondition === "none" && inAndOr) return;

    // Rule: can't add to "and" or "or" if already in "none"
    if ((activeCondition === "and" || activeCondition === "or") && inNone)
      return;

    setFilters((prev) => ({
      ...prev,
      [activeCondition]: prev[activeCondition].includes(tech)
        ? prev[activeCondition] // no duplicates
        : [...prev[activeCondition], tech],
    }));
  };
  const handleRemoveTech = (condition: "and" | "or" | "none", tech: string) => {
    setFilters((prev) => ({
      ...prev,
      [condition]: prev[condition].filter((t) => t !== tech),
    }));
  };

  return (
    <div className="my-4">
      <div className="font-semibold mb-1 font-sans">Technology Filters</div>

      {/* Search input */}
      <ComboboxInput
        items={technologies}
        placeholder="Search technologies..."
        onChange={handleAddTech}
      />

      {/* Condition Toggles */}
      <div className="mt-3 justify-around font-sans font-semibold flex">
        {(["and", "or", "none"] as const).map((cond) => (
          <div key={cond} className="flex items-center">
            <Checkbox
              className="mx-2 my-3 border-2"
              checked={activeCondition === cond}
              onCheckedChange={(checked) =>
                setActiveCondition(checked ? cond : null)
              }
            />
            <Label
              htmlFor={cond}
              className="text-[16px] font-semibold font-sans capitalize"
            >
              {cond.toUpperCase()}
            </Label>
          </div>
        ))}
      </div>

      {/* Badge Areas */}
      {(["and", "or", "none"] as const).map(
        (cond) =>
          activeCondition === cond && (
            <div
              key={cond}
              className="bg-gray-200 w-full h-auto my-3 rounded-lg p-2 flex flex-wrap gap-2"
            >
              {filters[cond].map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {tech}
                  <button
                    onClick={() => handleRemoveTech(cond, tech)}
                    className="cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
              {filters[cond].length === 0 && (
                <span className="text-sm text-gray-500">
                  No technologies added.
                </span>
              )}
            </div>
          )
      )}

      {/* Filtering type + remove duplicates */}
      <div className="mt-4 justify-around font-sans font-semibold flex">
        <div>
          <Select
            value={filters.filteringType}
            onValueChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                filteringType: val as "together" | "individual",
              }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtering Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="together">Filter Together</SelectItem>
              <SelectItem value="individual">Filter Individually</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          className={classNames(
            "flex items-center",
            filters.filteringType === "together" ? "disabled opacity-50" : ""
          )}
        >
          <Checkbox
            className="mx-2 my-3 border-2"
            checked={filters.removeDuplicates}
            onCheckedChange={(checked) =>
              setFilters((prev) => ({
                ...prev,
                removeDuplicates: Boolean(checked),
              }))
            }
          />
          <Label
            htmlFor="duplicates"
            className="text-[16px] font-semibold font-sans"
          >
            Remove Duplicates
          </Label>
        </div>
      </div>
    </div>
  );
}
