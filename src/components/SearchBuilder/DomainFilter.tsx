"use client";

import { useSearchStore } from "@/store/searchStore";
import { GenericFilter } from "./GenericFilter";

export function DomainFilter() {
  //getting the zustand action to set country filter
  const setDomainFilter = useSearchStore((s) => s.setDomainFilter);
  return (
    <GenericFilter
      label="Domain Filters"
      placeholder="Search domain..."
      //api endpoint to fetch the domains for recommendation in the combobox
      apiEndpoint="/api/domains"
      onFilterChange={setDomainFilter}
    />
  );
}