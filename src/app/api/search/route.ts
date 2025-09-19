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
    console.log("body")
    const body = await req.json() as SearchRequestBody;
    console.log(body)
    // Normalize: support both { ...filters } and { searchObject: { ...filters } }
    const normalized = (body.searchObject ?? body) as SearchRequestBody;
    
    
    // Create search object (remove textQuery if present)
    const searchObject: SearchObject = {
      technologyFilter: normalized.technologyFilter,
      countryFilter: normalized.countryFilter,
      categoryFilter: normalized.categoryFilter,
      nameFilter: normalized.nameFilter,
      domainFilter: normalized.domainFilter,
      numberFilter: normalized.numberFilter
    };

    // Always call runSearch - your single source of truth
    const data = await runSearch(db, searchObject);
    
    return NextResponse.json({ 
      success: true, 
      data,
      totalResults: data.length,
    });
    
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      //checks if err is an instance of the Error class and returns the message, 
      //otherwise returns 'Unknown error'
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
