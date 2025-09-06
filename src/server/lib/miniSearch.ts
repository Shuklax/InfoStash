// server/lib/miniSearch.ts
import MiniSearch from "minisearch";
import type { Kysely } from "kysely";
import type { DB } from "@/types/schema";
import { runSearch, type SearchObject } from "./searchBuilder";

interface SearchableCompany {
  id: string; // domain as ID
  domain: string;
  name: string;
  category: string;
  country: string;
  city: string;
  technologies: string; // comma-separated tech names
}

// Global singleton instance
let miniSearchInstance: MiniSearch<SearchableCompany> | null = null;
let isInitializing = false;

export async function initializeMiniSearch(
  db: Kysely<DB>
): Promise<MiniSearch<SearchableCompany>> {
  // Return existing instance if available
  if (miniSearchInstance) {
    return miniSearchInstance;
  }

  // Prevent multiple initializations
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return miniSearchInstance!;
  }

  isInitializing = true;
  console.log("Initializing MiniSearch...");

  try {
    // Get all companies with their technologies
    const companies = await db
      .selectFrom("companies")
      .leftJoin("company_tech", "companies.domain", "company_tech.domain")
      .leftJoin("technologies", "company_tech.tech_name", "technologies.name")
      .select([
        "companies.domain",
        "companies.name",
        "companies.category",
        "companies.country",
        "companies.city",
        // SQLite GROUP_CONCAT equivalent
        db.fn
          .agg<string>("group_concat", ["technologies.name"])
          .as("tech_names"),
      ])
      .groupBy([
        "companies.domain",
        "companies.name",
        "companies.category",
        "companies.country",
        "companies.city",
      ])
      .execute();

    // Transform for MiniSearch
    const searchableData: SearchableCompany[] = companies.map((company) => ({
      id: company.domain,
      domain: company.domain,
      name: company.name || "",
      category: company.category || "",
      country: company.country || "",
      city: company.city || "",
      technologies: company.tech_names || "",
    }));

    // Initialize MiniSearch
    miniSearchInstance = new MiniSearch({
      fields: ["name", "domain", "category", "country", "city", "technologies"],
      storeFields: ["domain", "name", "category", "country", "city"],
      searchOptions: {
        fuzzy: 0.2, // Allow some typos
        prefix: true, // Match partial words
        boost: {
          name: 3, // Company names are most important
          domain: 2, // Then domain names
          category: 1.5, // Then category
          technologies: 1.5, // And technologies
        },
      },
    });

    // Add documents
    miniSearchInstance.addAll(searchableData);

    console.log(
      `MiniSearch initialized with ${searchableData.length} companies`
    );
    return miniSearchInstance;
  } finally {
    isInitializing = false;
  }
}

export function searchCompanies(query: string, limit = 100): string[] {
  if (!miniSearchInstance || !query.trim()) {
    return [];
  }

  try {
    const results = miniSearchInstance.search(query, {
      combineWith: "OR", // More lenient matching
    });

    // Apply limit after search
    return results.slice(0, limit).map((r) => r.id); // Return domain names
  } catch (error) {
    console.error("MiniSearch error:", error);
    return [];
  }
}

// Check if any structured filters are active
function hasActiveStructuredFilters(structuredFilters: any): boolean {
  if (!structuredFilters) return false;
  
  return (
    structuredFilters.technologyFilter?.and?.length > 0 ||
    structuredFilters.technologyFilter?.or?.length > 0 ||
    structuredFilters.technologyFilter?.none?.length > 0 ||
    structuredFilters.countryFilter?.and?.length > 0 ||
    structuredFilters.countryFilter?.or?.length > 0 ||
    structuredFilters.countryFilter?.none?.length > 0 ||
    structuredFilters.categoryFilter?.and?.length > 0 ||
    structuredFilters.categoryFilter?.or?.length > 0 ||
    structuredFilters.categoryFilter?.none?.length > 0 ||
    (structuredFilters.numberFilter?.totalTechnologies ?? 0) > 0 ||
    (structuredFilters.numberFilter?.technologiesPerCategory ?? 0) > 0
  );
}

// Main combined search function
export async function performCombinedSearch(
  db: Kysely<DB>,
  textQuery: string,
  structuredFilters: any
): Promise<string[]> {
  const hasTextQuery = textQuery?.trim();
  const hasStructuredFilters = hasActiveStructuredFilters(structuredFilters);

  console.log('performCombinedSearch:', {
    hasTextQuery: !!hasTextQuery,
    hasStructuredFilters,
    textQuery: hasTextQuery?.substring(0, 50)
  });

  // Case 1: Only text query (from header)
  if (hasTextQuery && !hasStructuredFilters) {
    await initializeMiniSearch(db);
    const results = searchCompanies(textQuery);
    console.log(`Text-only search found ${results.length} results`);
    return results;
  }

  // Case 2: Only structured filters (from RunAndReset)
  if (!hasTextQuery && hasStructuredFilters) {
    const sqlResults = await runSearch(db, structuredFilters as SearchObject);
    const results = sqlResults.map((r) => r.domain);
    console.log(`Structured-only search found ${results.length} results`);
    return results;
  }

  // Case 3: Both text and structured filters (combined search)
  if (hasTextQuery && hasStructuredFilters) {
    // Get text results
    await initializeMiniSearch(db);
    const textResults = searchCompanies(textQuery);
    
    // Get structured results
    const sqlResults = await runSearch(db, structuredFilters as SearchObject);
    const structuredResults = sqlResults.map((r) => r.domain);
    
    // Find intersection
    const textSet = new Set(textResults);
    const combined = structuredResults.filter((domain) => textSet.has(domain));
    
    console.log(`Combined search: text=${textResults.length}, structured=${structuredResults.length}, intersection=${combined.length}`);
    return combined;
  }

  // Case 4: No search criteria
  console.log('No search criteria provided');
  return [];
}