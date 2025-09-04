// src/lib/search.ts
import { Kysely, sql, ExpressionBuilder } from "kysely";
import type { DB } from "@/types/schema";

// Shared with Zustand store (or defined here if not exported)
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

/* ---------------------------------------------------------------------- */
/* Main Entry                                                             */
/* ---------------------------------------------------------------------- */

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
  // 1) Build domain sets for each filter type
  const [techDomains, countryDomains, categoryDomains] = await Promise.all([
    buildTechDomainSet(db, search.technologyFilter, search.numberFilter),
    buildSimpleFieldDomainSet(db, "companies.country", search.countryFilter),
    buildSimpleFieldDomainSet(db, "companies.category", search.categoryFilter),
  ]);

  // 2) Intersect sets in JS
  const domainSets = [techDomains, countryDomains, categoryDomains].filter(
    (d): d is DomainRow[] => d !== null
  );

  let finalDomainSet: Set<string> | null = null;
  if (domainSets.length > 0) {
    finalDomainSet = domainSets
      .map(rows => new Set(rows.map(r => r.domain)))
      .reduce((acc, curr) => {
        const next = new Set<string>();
        for (const d of acc) if (curr.has(d)) next.add(d);
        return next;
      });
    if (finalDomainSet.size === 0) return [];
  }

  // 3) Final query with number filters
  let q = db
    .selectFrom("companies")
    .innerJoin("company_tech", "companies.domain", "company_tech.domain")
    .innerJoin("technologies", "company_tech.tech_name", "technologies.name")
    .select((eb: ExpressionBuilder<DB, "companies">) => [
      eb.ref("companies.domain").as("domain"),
      eb.ref("companies.name").as("name"),
      eb.ref("companies.category").as("category"),
      eb.ref("companies.country").as("country"),
      eb.ref("companies.city").as("city"),
      // Use countAll to avoid ReferenceExpression typing issues
      eb.fn.countAll().as("technologies"),
    ])
    .groupBy("companies.domain");

  if (finalDomainSet) {
    const list = Array.from(finalDomainSet);
    if (list.length === 0) return [];
    q = q.where("companies.domain", "in", list);
  }

  if (search.numberFilter?.totalTechnologies > 0) {
    q = q.having(sql`COUNT(technologies.name)`, ">=", search.numberFilter.totalTechnologies);
  }

  if (search.numberFilter?.technologiesPerCategory > 0) {
    q = q.where(({ exists, selectFrom, ref }) =>
      exists(
        selectFrom("company_tech")
          .innerJoin("technologies", "company_tech.tech_name", "technologies.name")
          .select(sql`1`.as("x"))
          .whereRef("company_tech.domain", "=", ref("companies.domain"))
          .groupBy("technologies.category")
          .having(sql`COUNT(technologies.name)`, ">=", search.numberFilter.technologiesPerCategory)
      )
    );
  }

  const rows = await q.execute();
  return rows.map(r => ({ ...r, technologies: Number(r.technologies) }));
}

/* ---------------------------------------------------------------------- */
/* Helpers                                                                */
/* ---------------------------------------------------------------------- */

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
      sql`COUNT(DISTINCT CASE WHEN ${sql.ref("technologies.name")} IN (${sql.join(filter.and)}) 
        THEN ${sql.ref("technologies.name")} END)`,
      ">=",
      filter.and.length
    );
  }

  if (filter.or.length > 0) {
    q = q.having(
      sql`COUNT(DISTINCT CASE WHEN ${sql.ref("technologies.name")} IN (${sql.join(filter.or)}) 
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
    q = q.having(sql`COUNT(${sql.ref("technologies.name")})`, ">=", number.totalTechnologies);
  }

  if (number?.technologiesPerCategory > 0) {
    q = q.where(({ exists, selectFrom, ref }) =>
      exists(
        selectFrom("company_tech")
          .innerJoin("technologies", "company_tech.tech_name", "technologies.name")
          .select(sql`1`.as("x"))
          .whereRef("company_tech.domain", "=", ref("companies.domain"))
          .groupBy("technologies.category")
          .having(sql`COUNT(${sql.ref("technologies.name")})`, ">=", number.technologiesPerCategory)
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
    ((number?.totalTechnologies ?? 0) > 0 || (number?.technologiesPerCategory ?? 0) > 0)
  ) {
    const rows = await db
      .selectFrom("companies")
      .innerJoin("company_tech", "companies.domain", "company_tech.domain")
      .innerJoin("technologies", "company_tech.tech_name", "technologies.name")
      .select("companies.domain")
      .groupBy("companies.domain")
      .$if(number.totalTechnologies > 0, qb =>
        qb.having(sql`COUNT(${sql.ref("technologies.name")})`, ">=", number.totalTechnologies)
      )
      .$if(number.technologiesPerCategory > 0, qb =>
        qb.where(({ exists, selectFrom, ref }) =>
          exists(
            selectFrom("company_tech")
              .innerJoin("technologies", "company_tech.tech_name", "technologies.name")
              .select(sql`1`.as("x"))
              .whereRef("company_tech.domain", "=", ref("companies.domain"))
              .groupBy("technologies.category")
              .having(sql`COUNT(${sql.ref("technologies.name")})`, ">=", number.technologiesPerCategory)
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
    merged = merged.filter(r => (seen.has(r.domain) ? false : (seen.add(r.domain), true)));
  }

  return merged;
}

async function buildSimpleFieldDomainSet(
  db: Kysely<DB>,
  column: "companies.country" | "companies.category",
  filter: BaseFilterBridge
): Promise<DomainRow[] | null> {
  const hasAny = filter.and.length > 0 || filter.or.length > 0 || filter.none.length > 0;
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
    const rows = await db.selectFrom("companies").select("domain").where(column, "=", v).execute();
    subsets.push(rows);
  }
  for (const v of filter.none) {
    const rows = await db.selectFrom("companies").select("domain").where(column, "!=", v).execute();
    subsets.push(rows);
  }

  if (subsets.length === 0) return null;

  let merged = subsets.flat();
  if (filter.removeDuplicates) {
    const seen = new Set<string>();
    merged = merged.filter(r => (seen.has(r.domain) ? false : (seen.add(r.domain), true)));
  }

  return merged;
}
// Note: The above functions buildTechDomainTogether, buildTechDomainIndividual, and buildSimpleFieldDomainSet
// are designed to handle different filtering strategies and can be further optimized or modified as needed.