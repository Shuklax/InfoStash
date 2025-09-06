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
import classNames from "classnames";

// type of filter state
export type FilterState = {
  and: string[];
  or: string[];
  none: string[];
  removeDuplicates: boolean;
  filteringType: "together" | "individual";
};

//type of props
type FilterProps = {
  label: string;
  placeholder: string;
  apiEndpoint: string;
  onFilterChange: (filters: FilterState) => void;
};

//this is a reusable compoenent for filters like technology, category, country for now
//this comprehensive filter can be used for other filters in the future as well
export function GenericFilter({
  label,
  placeholder,
  apiEndpoint,
  onFilterChange,
}: FilterProps) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    []
  );
  const [filters, setFilters] = useState<FilterState>({
    and: [],
    or: [],
    none: [],
    removeDuplicates: false,
    filteringType: "together",
  });

  // which condition is currently active as the selected inputs will go under that condition
  const [activeCondition, setActiveCondition] = useState<
    "and" | "or" | "none" | null
  >(null);

  //fetch options to be shown in the dropdown
  useEffect(() => {
    fetch(apiEndpoint)
      .then((res) => res.json())
      .then((data) => setOptions(data));
  }, [apiEndpoint]);

  // Sync to global store
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // add item to the active condition
  const handleAdd = (item: string) => {
    //item will not get appended without an active condition or if the item is empty
    if (!activeCondition || !item.trim()) return;

    const inAndOr = filters.and.includes(item) || filters.or.includes(item);
    const inNone = filters.none.includes(item);

    //if an item is present in and/or, it cannot be added to none and vice-versa
    //Note that an item can be present in both and/or
    if (activeCondition === "none" && inAndOr) return;
    if ((activeCondition === "and" || activeCondition === "or") && inNone)
      return;

    //adds the item if it's not there, but does nothing if it's already present.
    setFilters((prev) => ({
      ...prev,
      [activeCondition]: prev[activeCondition].includes(item)
        ? prev[activeCondition]
        : [...prev[activeCondition], item],
    }));
  };

    //remove item from a condition
  const handleRemove = (cond: "and" | "or" | "none", item: string) => {
    setFilters((prev) => ({
      ...prev,
      [cond]: prev[cond].filter((i) => i !== item),
    }));
  };

  return (
    <div className="my-4">
      <div className="font-semibold mb-1 font-sans">{label}</div>

      <ComboboxInput
        items={options}
        placeholder={placeholder}
        onChange={handleAdd}
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
              {filters[cond].map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {item}
                  <button
                    onClick={() => handleRemove(cond, item)}
                    className="cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
              {filters[cond].length === 0 && (
                <span className="text-sm text-gray-500">
                  No {label.toLowerCase()} added.
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
