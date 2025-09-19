import { POST } from "@/app/api/search/route";

// Mock runSearch to avoid DB dependency
jest.mock("@/server/lib/searchBuilder", () => ({
  runSearch: async () => [{ domain: "example.com", technologies: 2 }]
}));

describe("POST /api/search", () => {
  it("returns results with source metadata", async () => {
    const req = new Request("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({
        technologyFilter: { and: [], or: [], none: [], removeDuplicates: false, filteringType: "together" },
        countryFilter: { and: [], or: [], none: [], removeDuplicates: false, filteringType: "together" },
        categoryFilter: { and: [], or: [], none: [], removeDuplicates: false, filteringType: "together" },
        nameFilter: { and: [], or: [], none: [], removeDuplicates: false, filteringType: "together" },
        domainFilter: { and: [], or: [], none: [], removeDuplicates: false, filteringType: "together" },
        numberFilter: { totalTechnologies: 0, technologiesPerCategory: 0 },
        textQuery: "alpha"
      })
    });
    const res = await POST(req as any);
    const json: any = await (res as any).json();
    expect(json.success).toBe(true);;
    expect(json.data[0].domain).toBe("example.com");
  });
});


