import { create } from "zustand";

type FilterType = "together" | "individual";

type BaseFilter = {
  and: string[]; //items that MUST be present
  or: string[]; //items where ANY can be present
  none: string[]; //Items that MUST NOT be present
  removeDuplicates: boolean;
  filteringType: FilterType;
};

type NumberFilter = {
  totalTechnologies: number;
  technologiesPerCategory: number;
};

export type Company = {
  name: string | null;
  domain: string;
  category: string | null;
  country: string | null;
  technologies: number;
  city: string | null;
};

type SearchState = {
  technologyFilter: BaseFilter;
  countryFilter: BaseFilter;
  categoryFilter: BaseFilter;
  numberFilter: NumberFilter;
  nameFilter: BaseFilter;
  domainFilter: BaseFilter;
  textQuery: string;
  setTextQuery: (query: string) => void;
  setTechnologyFilter: (filter: BaseFilter) => void;
  setCountryFilter: (filter: BaseFilter) => void;
  setCategoryFilter: (filter: BaseFilter) => void;
  setNameFilter: (filter: BaseFilter) => void;
  setDomainFilter: (filter: BaseFilter) => void;
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


const initialState = {
  technologyFilter: { ...initialBaseFilter },
  countryFilter: { ...initialBaseFilter },
  categoryFilter: { ...initialBaseFilter },
  nameFilter: { ...initialBaseFilter },
  domainFilter: { ...initialBaseFilter },
  numberFilter: { totalTechnologies: 0, technologiesPerCategory: 0 },
   textQuery: "",
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initialState,
   // NEW: Text query setter
  setTextQuery: (query) => set({ textQuery: query }),
  setTechnologyFilter: (filter) => set({ technologyFilter: filter }),
  setCountryFilter: (filter) => set({ countryFilter: filter }),
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  setNameFilter: (filter) => set({ nameFilter: filter }),
  setDomainFilter: (filter) => set({ domainFilter: filter }),
  setNumberFilter: (filter) =>
    set((state) => ({
      numberFilter: { ...state.numberFilter, ...filter },
    })),
  results: [],
  setResults: (rows) => set({ results: rows }),
  reset: () => set({ ...initialState, results: [] }),
}));
