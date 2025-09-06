// src/lib/search.ts
import { Kysely, sql, ExpressionBuilder } from "kysely";
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
    search.numberFilter.totalTechnologies > 0 ||
    search.numberFilter.technologiesPerCategory > 0;

  // If no filters, return all companies with their tech counts (that'a why leftJoin)
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

  // Build domain sets for each filter type if filters exists
  const [techDomains, countryDomains, categoryDomains] = await Promise.all([
    //Queries the DB for domains (websites/records) that pass the provided technology and number filters.
    buildTechDomainSet(db, search.technologyFilter, search.numberFilter),
    //Queries the DB for domains matching a given country filter.
    buildSimpleFieldDomainSet(db, "companies.country", search.countryFilter),
    //Queries the DB for domains matching a given category filter.
    buildSimpleFieldDomainSet(db, "companies.category", search.categoryFilter),
  ]);

  //filters out any elements that is null
  //after filtering every element in domainSets is guranteed to be of type DomainRow[], not null
  const domainSets = [techDomains, countryDomains, categoryDomains].filter(
    (d): d is DomainRow[] => d !== null
  );

  // build sets and intersects them
  //Get all domain names that match all the provided filters (AND logic).
  let finalDomainSet: Set<string> | null = null;
  if (domainSets.length > 0) {
    finalDomainSet = domainSets
      .map((rows) => new Set(rows.map((r) => r.domain)))
      .reduce((acc, curr) => {
        const next = new Set<string>();
        for (const d of acc) if (curr.has(d)) next.add(d);
        return next;
      });
    if (finalDomainSet.size === 0) return [];
  }

  //Fetch every company, even those with no linked technologies (LEFT JOIN)
  let q = db
    .selectFrom("companies")
    .leftJoin("company_tech", "companies.domain", "company_tech.domain") // Changed to LEFT JOIN
    .leftJoin("technologies", "company_tech.tech_name", "technologies.name")
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
    ]);

  //adds a WHERE IN clause to the Kysely query to filter companies by domain,
  // based on the previously calculated finalDomainSet
  if (finalDomainSet) {
    const list = Array.from(finalDomainSet);
    if (list.length === 0) return [];
    q = q.where("companies.domain", "in", list);
  }

  //Filters out groups (companies) that have fewer than totalTechnologies.
  if (search.numberFilter?.totalTechnologies > 0) {
    q = q.having(
      sql`COUNT(company_tech.tech_name)`,
      ">=",
      search.numberFilter.totalTechnologies
    );
  }

  if (search.numberFilter?.technologiesPerCategory > 0) {
    //This subquery checks if a company has at least technologiesPerCategory number of technologies within each category.
    q = q.where(({ exists, selectFrom, ref }) =>
      exists(
        selectFrom("company_tech")
        //join company_tech with technologies to get technology info per company.
          .innerJoin(
            "technologies",
            "company_tech.tech_name",
            "technologies.name"
          )
          .select(sql`1`.as("x"))
          //links subquery to the outer query company row by domain.
          .whereRef("company_tech.domain", "=", ref("companies.domain"))
          //groups by technology category to count technologies per category per company.
          .groupBy("technologies.category")
          //filters grouped categories with count equal or above the threshold.
          .having(
            sql`COUNT(technologies.name)`,
            ">=",
            search.numberFilter.technologiesPerCategory
          )
      )
    );
  }

  const rows = await q.execute();
  return rows.map((r) => ({ ...r, technologies: Number(r.technologies) }));
}


/* Helpers for building domain sets based on different filters */

async function buildTechDomainSet(
  db: Kysely<DB>,
  filter: BaseFilterBridge,
  number: NumberFilterBridge
): Promise<DomainRow[] | null> {
  const hasAny =
    filter.and.length > 0 ||
    filter.or.length > 0 ||
    filter.none.length > 0 ||
    (number?.totalTechnologies ?? 0) > 0 ||
    (number?.technologiesPerCategory ?? 0) > 0;

  if (!hasAny) return null;

  if (filter.filteringType === "together") {
    return await buildTechDomainTogether(db, filter, number);
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
    .selectFrom("companies")
    .innerJoin("company_tech", "companies.domain", "company_tech.domain")
    .innerJoin("technologies", "company_tech.tech_name", "technologies.name")
    .groupBy("companies.domain")
    .select("companies.domain");

  if (filter.and.length > 0) {
    q = q.having(
      sql`COUNT(DISTINCT CASE WHEN ${sql.ref(
        "technologies.name"
      )} IN (${sql.join(filter.and)}) 
        THEN ${sql.ref("technologies.name")} END)`,
      ">=",
      filter.and.length
    );
  }

  if (filter.or.length > 0) {
    q = q.having(
      sql`COUNT(DISTINCT CASE WHEN ${sql.ref(
        "technologies.name"
      )} IN (${sql.join(filter.or)}) 
        THEN ${sql.ref("technologies.name")} END)`,
      ">=",
      1
    );
  }

  if (filter.none.length > 0) {
    // NOT EXISTS subquery for excluded techs
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

  if (number?.totalTechnologies > 0) {
    q = q.having(
      sql`COUNT(${sql.ref("technologies.name")})`,
      ">=",
      number.totalTechnologies
    );
  }

  if (number?.technologiesPerCategory > 0) {
    q = q.where(({ exists, selectFrom, ref }) =>
      exists(
        selectFrom("company_tech")
          .innerJoin(
            "technologies",
            "company_tech.tech_name",
            "technologies.name"
          )
          .select(sql`1`.as("x"))
          .whereRef("company_tech.domain", "=", ref("companies.domain"))
          .groupBy("technologies.category")
          .having(
            sql`COUNT(${sql.ref("technologies.name")})`,
            ">=",
            number.technologiesPerCategory
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
  const subSets: DomainRow[][] = [];

  // AND + OR → positive matches
  for (const t of [...filter.and, ...filter.or]) {
    const rows = await db
      .selectFrom("company_tech")
      .select("domain")
      .where("tech_name", "=", t)
      .groupBy("domain")
      .execute();
    subSets.push(rows);
  }

  // NONE → exclude matches
  for (const t of filter.none) {
    const rows = await db
      .selectFrom("companies")
      .select("domain")
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
    subSets.push(rows);
  }

  // If only number filters are active
  if (
    subSets.length === 0 &&
    ((number?.totalTechnologies ?? 0) > 0 ||
      (number?.technologiesPerCategory ?? 0) > 0)
  ) {
    const rows = await db
      .selectFrom("companies")
      .innerJoin("company_tech", "companies.domain", "company_tech.domain")
      .innerJoin("technologies", "company_tech.tech_name", "technologies.name")
      .select("companies.domain")
      .groupBy("companies.domain")
      .$if(number.totalTechnologies > 0, (qb) =>
        qb.having(
          sql`COUNT(${sql.ref("technologies.name")})`,
          ">=",
          number.totalTechnologies
        )
      )
      .$if(number.technologiesPerCategory > 0, (qb) =>
        qb.where(({ exists, selectFrom, ref }) =>
          exists(
            selectFrom("company_tech")
              .innerJoin(
                "technologies",
                "company_tech.tech_name",
                "technologies.name"
              )
              .select(sql`1`.as("x"))
              .whereRef("company_tech.domain", "=", ref("companies.domain"))
              .groupBy("technologies.category")
              .having(
                sql`COUNT(${sql.ref("technologies.name")})`,
                ">=",
                number.technologiesPerCategory
              )
          )
        )
      )
      .execute();
    subSets.push(rows);
  }

  if (subSets.length === 0) return [];

  // Merge + deduplicate if needed
  let merged = subSets.flat();
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
  column: "companies.country" | "companies.category",
  filter: BaseFilterBridge
): Promise<DomainRow[] | null> {
  const hasAny =
    filter.and.length > 0 || filter.or.length > 0 || filter.none.length > 0;
  if (!hasAny) return null;

  if (filter.filteringType === "together") {
    const allowed = [...new Set([...filter.and, ...filter.or])];
    let q = db.selectFrom("companies").select("domain");

    if (allowed.length > 0) q = q.where(column, "in", allowed);
    if (filter.none.length > 0) q = q.where(column, "not in", filter.none);

    return await q.execute();
  }

  // individual
  const subsets: DomainRow[][] = [];

  for (const v of [...filter.and, ...filter.or]) {
    const rows = await db
      .selectFrom("companies")
      .select("domain")
      .where(column, "=", v)
      .execute();
    subsets.push(rows);
  }
  for (const v of filter.none) {
    const rows = await db
      .selectFrom("companies")
      .select("domain")
      .where(column, "!=", v)
      .execute();
    subsets.push(rows);
  }

  if (subsets.length === 0) return null;

  let merged = subsets.flat();
  if (filter.removeDuplicates) {
    const seen = new Set<string>();
    merged = merged.filter((r) =>
      seen.has(r.domain) ? false : (seen.add(r.domain), true)
    );
  }

  return merged;
}
// Note: The above helper functions can be further optimized. This is a basic implementation.
