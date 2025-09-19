// src/server/lib/searchBuilder.ts
import { Kysely, sql } from "kysely";
import type { DB } from "@/types/schema";

type FilterType = "together" | "individual";

export interface BaseFilterBridge {
  and: string[];
  or: string[];
  none: string[];
  removeDuplicates: boolean;
  filteringType: FilterType;
}

export interface NumberFilterBridge {
  totalTechnologies: number;
  technologiesPerCategory: number;
}

export interface SearchObject {
  technologyFilter: BaseFilterBridge;
  countryFilter: BaseFilterBridge;
  categoryFilter: BaseFilterBridge;
  nameFilter: BaseFilterBridge;
  domainFilter: BaseFilterBridge;
  numberFilter: NumberFilterBridge;
}

type DomainRow = { domain: string };

export async function runSearch(
  db: Kysely<DB>,
  search: SearchObject
): Promise<
  Array<{
    domain: string;
    name: string | null;
    category: string | null;
    country: string | null;
    city: string | null;
    technologies: number;
  }>
> {
  // Check if any filters are actually applied
  const hasFilters =
    search.technologyFilter.and.length > 0 ||
    search.technologyFilter.or.length > 0 ||
    search.technologyFilter.none.length > 0 ||
    search.countryFilter.and.length > 0 ||
    search.countryFilter.or.length > 0 ||
    search.countryFilter.none.length > 0 ||
    search.categoryFilter.and.length > 0 ||
    search.categoryFilter.or.length > 0 ||
    search.categoryFilter.none.length > 0 ||
    search.nameFilter.and.length > 0 ||
    search.nameFilter.or.length > 0 ||
    search.nameFilter.none.length > 0 ||
    search.domainFilter.and.length > 0 ||
    search.domainFilter.or.length > 0 ||
    search.domainFilter.none.length > 0 ||
    search.numberFilter.totalTechnologies > 0 ||
    search.numberFilter.technologiesPerCategory > 0;

  // If no filters, return all companies
  if (!hasFilters) {
    const rows = await db
      .selectFrom("companies")
      .leftJoin("company_tech", "companies.domain", "company_tech.domain")
      .select((eb) => [
        eb.ref("companies.domain").as("domain"),
        eb.ref("companies.name").as("name"),
        eb.ref("companies.category").as("category"),
        eb.ref("companies.country").as("country"),
        eb.ref("companies.city").as("city"),
        eb.fn.count("company_tech.tech_name").as("technologies"),
      ])
      .groupBy([
        "companies.domain",
        "companies.name",
        "companies.category",
        "companies.country",
        "companies.city",
      ])
      .execute();

    return rows.map((r) => ({ ...r, technologies: Number(r.technologies) }));
  }

  // Build domain sets for each filter type
  const [
    techDomains,
    countryDomains,
    categoryDomains,
    nameDomains,
    domainDomains,
  ] = await Promise.all([
    //concurrently executing multiple db queries to build domain sets for each filter type
    buildTechDomainSet(db, search.technologyFilter, search.numberFilter),
    buildSimpleFieldDomainSet(db, "companies.country", search.countryFilter),
    buildSimpleFieldDomainSet(db, "companies.category", search.categoryFilter),
    buildSimpleFieldDomainSet(db, "companies.name", search.nameFilter),
    buildSimpleFieldDomainSet(db, "companies.domain", search.domainFilter),
  ]);

  // Filter out nulls and intersect all domain sets
  const domainSets = [
    techDomains,
    countryDomains,
    categoryDomains,
    nameDomains,
    domainDomains,
    //ensures the filters array is typed as an array of non-null domain arrays
  ].filter((d): d is DomainRow[] => d !== null);

  //finalDomainSet is either a set of strings or null
  let finalDomainSet: Set<string> | null = null;
  //if there are filtered domain sets, it converts each to a set of domain strings
  if (domainSets.length > 0) {
    finalDomainSet = domainSets
      .map((rows) => new Set(rows.map((r) => r.domain)))
      //reduces those sets by intersecting them to find out domains present in all sets (intersection of filter results)
      .reduce((acc, curr) => {
        const next = new Set<string>();
        for (const d of acc) if (curr.has(d)) next.add(d);
        return next;
      });
    //if the final set is empty, return an empty array; meaning no companies match all filters
    if (finalDomainSet.size === 0) return [];
  }

  // Build final query
  let q = db
    //selecting from companies table
    .selectFrom("companies")
    // left joining "company_tech" and "technologies" to include related tech info
    .leftJoin("company_tech", "companies.domain", "company_tech.domain")
    .leftJoin("technologies", "company_tech.tech_name", "technologies.name")
    .select((eb) => [
      //selects the company attribute and count the no. of techologies per company
      eb.ref("companies.domain").as("domain"),
      eb.ref("companies.name").as("name"),
      eb.ref("companies.category").as("category"),
      eb.ref("companies.country").as("country"),
      eb.ref("companies.city").as("city"),
      eb.fn.count("company_tech.tech_name").as("technologies"),
    ])

    //groups by company attributes to aggregate technologies correctly
    .groupBy([
      "companies.domain",
      "companies.name",
      "companies.category",
      "companies.country",
      "companies.city",
    ]);

  //if final domain set exists, convert it to an array
  if (finalDomainSet) {
    const list = Array.from(finalDomainSet);
    //if the array "list" is empty, return an empty array
    if (list.length === 0) return [];
    //add the "WHERE domain IN" filter limiting results to only domains in the intersection
    q = q.where("companies.domain", "in", list);
  }

  // Apply number filters
  //if there's a minimum total technology filter, adds a "HAVING" clause to return companies with at least that many technologies.
  if (search.numberFilter?.totalTechnologies > 0) {
    q = q.having(
      sql`COUNT(company_tech.tech_name)`,
      ">=",
      search.numberFilter.totalTechnologies
    );
  }

  //checks if number filter for "technologiesPerCategory" is greater than 0
  if (search.numberFilter?.technologiesPerCategory > 0) {
    q = q.where(({ exists, selectFrom, ref }) =>
      exists(
        //selects the company_tech table
        selectFrom("company_tech")
          //joins with "technologies" on matching technology names
          .innerJoin(
            "technologies",
            "company_tech.tech_name",
            "technologies.name"
          )
          //selecting dummy column "1 AS x" just to satisfy syntax
          .select(sql`1`.as("x"))
          //filters rows where the domain column matches the company domain
          .whereRef("company_tech.domain", "=", ref("companies.domain"))
          //group these joined rows by technologies.category
          .groupBy("technologies.category")
          //having clause requiring the count of technologies.name to be greater than or equal to the number filter
          .having(
            sql`COUNT(technologies.name)`,
            ">=",
            search.numberFilter.technologiesPerCategory
          )
      )
    );
  }

  //execute the query
  const rows = await q.execute();
  //return the rows with the technologies count
  return rows.map((r) => ({ ...r, technologies: Number(r.technologies) }));
}

// Helper functions (keeping existing ones + adding support for name/domain)
async function buildTechDomainSet(
  db: Kysely<DB>,
  filter: BaseFilterBridge,
  number: NumberFilterBridge
): Promise<DomainRow[] | null> {
  //"hasAny" is a boolean indicating if the filtering criteria exists or not
  const hasAny =
    filter.and.length > 0 ||
    filter.or.length > 0 ||
    filter.none.length > 0 ||
    (number?.totalTechnologies ?? 0) > 0 ||
    (number?.technologiesPerCategory ?? 0) > 0;

  if (!hasAny) return null;

  // if filter together is applied
  if (filter.filteringType === "together") {
    return await buildTechDomainTogether(db, filter, number);
    // if filter individual is applied
  } else {
    return await buildTechDomainIndividual(db, filter, number);
  }
}

async function buildTechDomainTogether(
  db: Kysely<DB>,
  filter: BaseFilterBridge,
  number: NumberFilterBridge
): Promise<DomainRow[]> {
  let q = db
    // starts building queries from the companies table
    .selectFrom("companies")
    //joins the "company_tech" table on the domain field, linking companies to their techs
    .innerJoin("company_tech", "companies.domain", "company_tech.domain")
    //joins "technologies" on tech name to gather more tech details
    .innerJoin("technologies", "company_tech.tech_name", "technologies.name")
    //aggregation happens per company
    .groupBy("companies.domain")
    //selects the domain column
    .select("companies.domain");

  //if the filter array is non-empty
  if (filter.and.length > 0) {
    //adds a having clause that counts distinct technologies listed in the "and" filter for each domain
    //ensures the count is greater than or equal to the number of "and" filter items, i.e., the company must have all technologies in the "and" filter
    q = q.having(
      sql`COUNT(DISTINCT CASE WHEN ${sql.ref(
        "technologies.name"
      )} IN (${sql.join(filter.and)}) 
        THEN ${sql.ref("technologies.name")} END)`,
      ">=",
      filter.and.length
    );
  }

  //if the "or" filter array is non-empty
  if (filter.or.length > 0) {
    //adds a second "having" clause requiring at least one technology from the "or" filter to be present
    //this works in conjunction with the "and" clause, so the domain must satisfy both.
    q = q.having(
      sql`COUNT(DISTINCT CASE WHEN ${sql.ref(
        "technologies.name"
      )} IN (${sql.join(filter.or)}) 
        THEN ${sql.ref("technologies.name")} END)`,
      ">=",
      1
    );
  }

  //if the "none" filter array is non-empty
  if (filter.none.length > 0) {
    //adds a "where not exists" condition to exclude companies that have any techology listed in the "none" filter
    //this works in conjunction with the "and" and "or" filters, so the domain must satisfy this too.
    q = q.where(({ not, exists, selectFrom, ref }) =>
      not(
        exists(
          selectFrom("company_tech")
            .select("company_tech.domain")
            .whereRef("company_tech.domain", "=", ref("companies.domain"))
            .where("company_tech.tech_name", "in", filter.none)
        )
      )
    );
  }

  return await q.execute();
}

async function buildTechDomainIndividual(
  db: Kysely<DB>,
  filter: BaseFilterBridge,
  number: NumberFilterBridge
): Promise<DomainRow[]> {
  //intilializes an array to hold multiple subsets of domain rows returned from individual queries
  const subSets: DomainRow[][] = [];

  //Runs a query on company_tech table selecting distinct domains for which tech_name equals t.
  for (const t of [...filter.and, ...filter.or]) {
    const rows = await db
      .selectFrom("company_tech")
      .select("domain")
      .where("tech_name", "=", t)
      //Groups by domain to ensure uniqueness of domains.
      .groupBy("domain")
      .execute();
    //collects all the resulting rows into the subsets array
    subSets.push(rows);
  }

  //runs a query on "companies" selecting domains that do NOT have that technology
  for (const t of filter.none) {
    const rows = await db
      .selectFrom("companies")
      .select("domain")
      //".where" method is being called with a callback function that receives an explression builder as a parameter(an object containing functions like "not", "exists", "selectFrom", "ref")
      //inside the callback, we compose complex, nested "WHERE" clauses in a type-safe manner.
      .where(({ not, exists, selectFrom, ref }) =>
        not(
          exists(
            selectFrom("company_tech")
              .select("domain")
              .whereRef("company_tech.domain", "=", ref("companies.domain"))
              .where("company_tech.tech_name", "=", t)
          )
        )
      )
      .execute();
    //adding the resultant rows to the subsets array
    subSets.push(rows);
  }

  //if there are no subsets, return an empty array
  if (subSets.length === 0) return [];

  //flattens the array of arrays into a single list of domains from all subsets.
  let merged = subSets.flat();

  //if deduplicartion is required, then creates a set to track seen domains and removes duplicates
  if (filter.removeDuplicates) {
    const seen = new Set<string>();
    merged = merged.filter((r) =>
      seen.has(r.domain) ? false : (seen.add(r.domain), true)
    );
  }

  return merged;
}

async function buildSimpleFieldDomainSet(
  db: Kysely<DB>,
  column:
    | "companies.country"
    | "companies.category"
    | "companies.name"
    | "companies.domain",
  filter: BaseFilterBridge
): Promise<DomainRow[] | null> {
  //checks if there is any filter applied in that column
  const hasAny =
    filter.and.length > 0 || filter.or.length > 0 || filter.none.length > 0;
  if (!hasAny) return null;

  //if filter together is applied
  if (filter.filteringType === "together") {
    //combines the "and" and "or" filters into a unique set "allowed"
    const allowed = [...new Set([...filter.and, ...filter.or])];
    //selects the domain column from the companies table
    let q = db.selectFrom("companies").select("domain");

    //only include rows where the selected column value is in the "allowed" set
    if (allowed.length > 0) q = q.where(column, "in", allowed);
    //filter out rows where the selected column value is in the "none" set
    if (filter.none.length > 0) q = q.where(column, "not in", filter.none);

    //execute the query and return the result
    return await q.execute();
  }

  // if filter individual is applied
  //intilializes an array to hold multiple subsets of domain rows returned from individual queries
  const subsets: DomainRow[][] = [];

  //for each value "v" in "and" and "or" filters (treated individually), executes a query selecting domains where "column=v"
  //Writing [...filter.and, ...filter.or] creates a new combined array containing all elements from both filter.and and filter.or arrays.
  for (const v of [...filter.and, ...filter.or]) {
    const rows = await db
      .selectFrom("companies")
      .select("domain")
      .where(column, "=", v)
      .execute();
    //collects all the resulting rows into the subsets array
    subsets.push(rows);
  }

  //for each value in the "none" filter, queries domains where the clumn is "not" equal to "v"
  for (const v of filter.none) {
    const rows = await db
      .selectFrom("companies")
      .select("domain")
      .where(column, "!=", v)
      .execute();
    //collects all the resulting rows into the subsets array
    subsets.push(rows);
  }

  //if there are no subsets, return null
  if (subsets.length === 0) return null;

  //flattens the subsets array into a single array
  let merged = subsets.flat();

  //if "removeDuplicates" flag is true, removes duplicate entries using a Set to track seen domains
  if (filter.removeDuplicates) {
    const seen = new Set<string>();
    merged = merged.filter((r) =>
      seen.has(r.domain) ? false : (seen.add(r.domain), true)
    );
  }

  //final filtered array contains only the first occurrence of each unique "domain" value, effectively removing duplicates
  return merged;
}
