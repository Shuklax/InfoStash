"use client";

import { useSearchStore } from "@/store/searchStore";
import { GenericFilter } from "./GenericFilter";

export function CountryFilter() {
  //getting the zustand action to set country filter
  const setCountryFilter = useSearchStore((s) => s.setCountryFilter);
  return (
    <GenericFilter
      label="Country Filters"
      placeholder="Search country..."
      //api endpoint to fetch the categories for recommendation in the combobox
      apiEndpoint="/api/countries"
      onFilterChange={setCountryFilter}
    />
  );
}