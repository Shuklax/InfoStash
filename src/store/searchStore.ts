import { create } from "zustand";

// Represents the type of filtering logic for a filter group
type FilterType = "together" | "individual";

// The structure for all base filters used throughout the app
type BaseFilter = {
  and: string[];            // Items that MUST all be present (AND logic)
  or: string[];             // Items where ANY can be present (OR logic)
  none: string[];           // Items that MUST NOT be present (exclusions)
  removeDuplicates: boolean;// If true, duplicate results are filtered out
  filteringType: FilterType;// Filtering strategy: 'together' or 'individual'
};

// Initial default state for a BaseFilter
const initialBaseFilter: BaseFilter = {
  and: [],
  or: [],
  none: [],
  removeDuplicates: false,
  filteringType: "together",
};

// Numeric filters for technology and category requirements
type NumberFilter = {
  totalTechnologies: number;        // Minimum total technologies required
  technologiesPerCategory: number;  // Minimum technologies per category
};


// Optional helper for normalizing partial filter objects into a full BaseFilter shape
/*
const normalizeBaseFilter = (filter?: Partial<BaseFilter>): BaseFilter => ({
  and: filter?.and ?? [],
  or: filter?.or ?? [],
  none: filter?.none ?? [],
  removeDuplicates: filter?.removeDuplicates ?? false,
  filteringType: filter?.filteringType ?? "together",
});
*/

// Main search state shape, including all active filters, result set, and setters
type SearchState = {
  technologyFilter: BaseFilter;    // Filter for technologies used
  countryFilter: BaseFilter;       // Filter for country restrictions
  categoryFilter: BaseFilter;      // Filter for company categories
  numberFilter: NumberFilter;      // Numeric filter settings
  nameFilter: BaseFilter;          // Filter for company names
  domainFilter: BaseFilter;        // Filter for company domain names
  textQuery: string;               // Freeform text search

  // State setters for each property (for UI or API input)
  setTextQuery: (query: string) => void;
  setTechnologyFilter: (filter: BaseFilter) => void;
  setCountryFilter: (filter: BaseFilter) => void;
  setCategoryFilter: (filter: BaseFilter) => void;
  setNameFilter: (filter: BaseFilter) => void;
  setDomainFilter: (filter: BaseFilter) => void;
  setNumberFilter: (filter: Partial<NumberFilter>) => void;
  setFiltersFromLLM: (parsed: Partial<SearchState>) => void; // Accepts and merges partial filter objects from an LLM

  results: Company[];                  // Array of companies matching current filters
  setResults: (rows: Company[]) => void;
  reset: () => void;                   // Resets the search state to initial values
};

// Initial state object for the entire search store
const initialState = {
  technologyFilter: { ...initialBaseFilter },
  countryFilter: { ...initialBaseFilter },
  categoryFilter: { ...initialBaseFilter },
  nameFilter: { ...initialBaseFilter },
  domainFilter: { ...initialBaseFilter },
  numberFilter: { totalTechnologies: 0, technologiesPerCategory: 0 },
  textQuery: "",
};

// Model of a single company, used as search results and for data display
export type Company = {
  name: string | null;
  domain: string;
  category: string | null;
  country: string | null;
  technologies: number;
  city: string | null;
};

// Zustand store implementation for the search logic and UI states
export const useSearchStore = create<SearchState>((set) => ({
  ...initialState,

  // Setters for updating each filter and property individually
  setTextQuery: (query) => set({ textQuery: query }),
  setTechnologyFilter: (filter) => set({ technologyFilter: filter }),
  setCountryFilter: (filter) => set({ countryFilter: filter }),
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  setNameFilter: (filter) => set({ nameFilter: filter }),
  setDomainFilter: (filter) => set({ domainFilter: filter }),

  // Safely merge in updated number filters
  setNumberFilter: (filter) =>
    set((state) => ({
      numberFilter: { ...state.numberFilter, ...filter },
    })),

  // Bulk update filters, e.g. from LLM-parsed suggestions or quick presets
  setFiltersFromLLM: (parsed) =>
    set((state) => ({
      technologyFilter: parsed.technologyFilter ?? { ...initialBaseFilter },
      countryFilter: parsed.countryFilter ?? { ...initialBaseFilter },
      categoryFilter: parsed.categoryFilter ?? { ...initialBaseFilter },
      nameFilter: parsed.nameFilter ?? { ...initialBaseFilter },
      domainFilter: parsed.domainFilter ?? { ...initialBaseFilter },
      numberFilter: {
        totalTechnologies:
          parsed.numberFilter?.totalTechnologies ??
          state.numberFilter.totalTechnologies,
        technologiesPerCategory:
          parsed.numberFilter?.technologiesPerCategory ??
          state.numberFilter.technologiesPerCategory,
      },
    })),

  // Set the results array with a new set of companies
  results: [],
  setResults: (rows) => set({ results: rows }),

  // Reset all filters and results back to their original defaults
  reset: () => set({ ...initialState, results: [] }),
}));

//Shape of the search history store
type HistoryState = {
  // history: [];
  historySheetOpen: boolean;
  setHistorySheetOpen: (open: boolean) => void;
};

// Store for storing the search history(optional) and the open/closed state of a UI sheet
export const useSearchHistoryStore = create<HistoryState>((set) => ({
  // history: [],
  historySheetOpen: false,
  setHistorySheetOpen: (open) => set({ historySheetOpen: open }),
}));
