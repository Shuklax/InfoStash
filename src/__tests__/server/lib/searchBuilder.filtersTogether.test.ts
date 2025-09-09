import { runSearch, type SearchObject } from "@/server/lib/searchBuilder";
import type { Kysely } from "kysely";

function dbMock(): Kysely<any> {
  const allRows = [
    { domain: "z.com", name: "Z", category: "C", country: "US", city: "NYC", technologies: 2 },
  ];
  const builder: any = {
    innerJoin: () => builder,
    leftJoin: () => builder,
    select: () => builder,
    groupBy: () => builder,
    where: () => builder,
    whereRef: () => builder,
    having: () => builder,
    execute: async () => allRows,
  };
  return { selectFrom: () => builder, fn: { count: () => 2 } } as any;
}

const base = { and: [], or: [], none: [], removeDuplicates: false, filteringType: "together" as const };

describe("searchBuilder filters together", () => {
  it("applies number filters", async () => {
    const res = await runSearch(dbMock(), {
      technologyFilter: base,
      countryFilter: base,
      categoryFilter: base,
      nameFilter: base,
      domainFilter: base,
      numberFilter: { totalTechnologies: 1, technologiesPerCategory: 0 },
    } satisfies SearchObject);
    expect(res.length).toBe(1);
  });
});


