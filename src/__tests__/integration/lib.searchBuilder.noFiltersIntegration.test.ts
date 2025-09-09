import { runSearch, type SearchObject } from "@/server/lib/searchBuilder";
import type { Kysely } from "kysely";

function dbMock(): Kysely<any> {
  const rows = [
    { domain: "x.com", name: "X", category: "C", country: "US", city: "NYC", technologies: 1 },
  ];
  const builder: any = {
    leftJoin: () => builder,
    select: () => builder,
    groupBy: () => builder,
    execute: async () => rows,
  };
  return { selectFrom: () => builder, fn: { count: () => 1 } } as any;
}

const empty = { and: [], or: [], none: [], removeDuplicates: false, filteringType: "together" as const };

describe("searchBuilder integration", () => {
  it("returns all when no filters", async () => {
    const res = await runSearch(dbMock(), {
      technologyFilter: empty,
      countryFilter: empty,
      categoryFilter: empty,
      nameFilter: empty,
      domainFilter: empty,
      numberFilter: { totalTechnologies: 0, technologiesPerCategory: 0 },
    } satisfies SearchObject);
    expect(res[0].domain).toBe("x.com");
  });
});


