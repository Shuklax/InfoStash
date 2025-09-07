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

// // helper: ensure BaseFilter shape
// const normalizeBaseFilter = (filter?: Partial<BaseFilter>): BaseFilter => ({
//   and: filter?.and ?? [],
//   or: filter?.or ?? [],
//   none: filter?.none ?? [],
//   removeDuplicates: filter?.removeDuplicates ?? false,
//   filteringType: filter?.filteringType ?? "together",
// });

type SearchState = {
  technologyFilter: BaseFilter;
  countryFilter: BaseFilter;
  categoryFilter: BaseFilter;
  numberFilter: NumberFilter;
  nameFilter: BaseFilter;
  domainFilter: BaseFilter;
  textQuery: string;

  //setters
  setTextQuery: (query: string) => void;
  setTechnologyFilter: (filter: BaseFilter) => void;
  setCountryFilter: (filter: BaseFilter) => void;
  setCategoryFilter: (filter: BaseFilter) => void;
  setNameFilter: (filter: BaseFilter) => void;
  setDomainFilter: (filter: BaseFilter) => void;
  setNumberFilter: (filter: Partial<NumberFilter>) => void;
  setFiltersFromLLM: (parsed: Partial<SearchState>) => void;
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
  //Text query setter
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


  results: [],
  setResults: (rows) => set({ results: rows }),
  reset: () => set({ ...initialState, results: [] }),
}));

type HistoryState = {
  history: [];
  historySheetOpen: boolean;
  setHistorySheetOpen: (open: boolean) => void;
};

export const useSearchHistoryStore = create<HistoryState>((set) => ({
  history: [],
  historySheetOpen: false,
  setHistorySheetOpen: (open) => set({ historySheetOpen: open }),
}));
