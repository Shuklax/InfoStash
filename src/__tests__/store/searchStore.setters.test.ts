import { useSearchStore } from "@/store/searchStore";

describe("useSearchStore setters (unit)", () => {
  it("updates filters and results", () => {
    const { setTechnologyFilter, setResults } = useSearchStore.getState() as any;
    setTechnologyFilter({ and: ["React"], or: [], none: [], removeDuplicates: false, filteringType: "together" });
    setResults([{ domain: "d.com", name: null, category: null, country: null, technologies: 1, city: null }]);
    expect(useSearchStore.getState().technologyFilter.and).toContain("React");
    expect(useSearchStore.getState().results[0].domain).toBe("d.com");
  });
});


