"use client";

import { useSearchStore } from "@/store/searchStore";
import { GenericFilter } from "./GenericFilter";

export function NameFilter() {
  //getting the zustand action to set country filter
  const setNameFilter = useSearchStore((s) => s.setNameFilter);
  return (
    <GenericFilter
      label="Name Filters"
      placeholder="Search name..."
      //api endpoint to fetch the name of companies for recommendation in the combobox
      apiEndpoint="/api/names"
      onFilterChange={setNameFilter}
    />
  );
}