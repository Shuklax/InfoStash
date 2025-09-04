import { create } from "zustand";

type FilterType = "together" | "individual";

type BaseFilter = {
  and: string[];
  or: string[];
  none: string[];
  removeDuplicates: boolean;
  filteringType: FilterType;
};

type NumberFilter = {
  totalTechnologies: number;
  technologiesPerCategory: number;
};

type SearchState = {
  technologyFilter: BaseFilter;
  countryFilter: BaseFilter;
  categoryFilter: BaseFilter;
  numberFilter: NumberFilter;
  setTechnologyFilter: (filter: BaseFilter) => void;
  setCountryFilter: (filter: BaseFilter) => void;
  setCategoryFilter: (filter: BaseFilter) => void;
  setNumberFilter: (filter: Partial<NumberFilter>) => void;
  results: Company[];
  setResults: (rows: Company[]) => void;
  reset: () => void;
};

const initialBaseFilter: BaseFilter = {
  and: [],
  or: [],
  none: [],
  removeDuplicates: false,
  filteringType: "together",
};

const initialState: Omit<
  SearchState,
  | "setTechnologyFilter"
  | "setCountryFilter"
  | "setCategoryFilter"
  | "setNumberFilter"
  | "reset"
  | "results"
  | "setResults"
> = {
  technologyFilter: { ...initialBaseFilter },
  countryFilter: { ...initialBaseFilter },
  categoryFilter: { ...initialBaseFilter },
  numberFilter: {
    totalTechnologies: 0,
    technologiesPerCategory: 0,
  },
};

export type Company = {
  name: string | null;
  domain: string;
  category: string | null;
  country: string | null;
  technologies: number;
  city: string | null;
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initialState,
  setTechnologyFilter: (filter) => set({ technologyFilter: filter }),
  setCountryFilter: (filter) => set({ countryFilter: filter }),
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  setNumberFilter: (filter) =>
    set((state) => ({
      numberFilter: { ...state.numberFilter, ...filter },
    })),
  results: [],
  setResults: (rows) => set({ results: rows }),
  reset: () => set(initialState),
}));
