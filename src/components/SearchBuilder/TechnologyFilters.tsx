"use client";

import { useSearchStore } from "@/store/searchStore";
import { GenericFilter } from "./GenericFilter";

export function TechnologyFilters() {
  //getting the zustand action to set technology filter
  const setTechnologyFilter = useSearchStore((s) => s.setTechnologyFilter);
  return (
    <GenericFilter
      label="Technology Filters"
      placeholder="Search technologies..."
      //api endpoint to fetch the categories for recommendation in the combobox
      apiEndpoint="/api/technologies"
      onFilterChange={setTechnologyFilter}
    />
  );
}
