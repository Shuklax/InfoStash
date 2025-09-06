"use client";

import { useSearchStore } from "@/store/searchStore";
import { GenericFilter } from "./GenericFilter";

export function CompanyCategoryFilter() {
  //getting the zustand action to set category filter
  const setCategoryFilter = useSearchStore((s) => s.setCategoryFilter);
  return (
    <GenericFilter
      label="Company Category Filters"
      placeholder="Search categories..."
      //api endpoint to fetch the categories for recommendation in the combobox
      apiEndpoint="/api/categories"
      onFilterChange={setCategoryFilter}
    />
  );
}
