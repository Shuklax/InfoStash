import { useSearchStore } from "@/store/searchStore";

describe("useSearchStore.setFiltersFromLLM (unit)", () => {
  it("applies parsed filters partially", () => {
    (useSearchStore.getState() as any).setFiltersFromLLM({
      countryFilter: { and: ["US"], or: [], none: [], removeDuplicates: false, filteringType: "together" },
      numberFilter: { totalTechnologies: 5, technologiesPerCategory: 0 },
    });
    expect(useSearchStore.getState().countryFilter.and).toEqual(["US"]);
    expect(useSearchStore.getState().numberFilter.totalTechnologies).toBe(5);
  });
});


