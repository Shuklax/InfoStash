// app/api/search/route.ts
import { NextResponse } from "next/server";
import db from "@/server/lib/db";
import { runSearch, type SearchObject } from "@/server/lib/searchBuilder";

// Type for the request body (can include textQuery for internal requests)
interface SearchRequestBody extends SearchObject {
  textQuery?: string; // Optional for internal requests
  searchObject?: SearchObject; // External calls may wrap filters
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as SearchRequestBody;

    // Normalize: support both { ...filters } and { searchObject: { ...filters } }
    const normalized = (body.searchObject ?? body) as SearchRequestBody;
    
    // Determine if internal (from your store) or external (API consumer)
    const isInternal = normalized.textQuery !== undefined; // Internal calls may have textQuery
    
    // Create search object (remove textQuery if present)
    const searchObject: SearchObject = {
      technologyFilter: normalized.technologyFilter,
      countryFilter: normalized.countryFilter,
      categoryFilter: normalized.categoryFilter,
      nameFilter: normalized.nameFilter,
      domainFilter: normalized.domainFilter,
      numberFilter: normalized.numberFilter
    };
    
    console.log('Search request:', { 
      type: isInternal ? 'internal' : 'external',
      hasFilters: Object.values(searchObject).some(filter => {
        if (filter && typeof filter === 'object') {
          // Check BaseFilter properties
          if ('and' in filter && 'or' in filter && 'none' in filter) {
            return filter.and.length > 0 || filter.or.length > 0 || filter.none.length > 0;
          }
          // Check NumberFilter properties  
          if ('totalTechnologies' in filter && 'technologiesPerCategory' in filter) {
            return filter.totalTechnologies > 0 || filter.technologiesPerCategory > 0;
          }
        }
        return false;
      })
    });

    // Always call runSearch - your single source of truth
    const data = await runSearch(db, searchObject);
    
    return NextResponse.json({ 
      success: true, 
      data,
      totalResults: data.length,
      source: isInternal ? 'internal' : 'external'
    });
    
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
