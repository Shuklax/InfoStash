import { NextResponse } from "next/server";
import db from "@/server/lib/db";          // your Kysely instance
import {runSearch} from "@/server/lib/searchBuilder";

export async function POST(req: Request) {
  try {
    const searchObject = await req.json();
    // Pass the search object to your search function along with the db instance
    //run searches runs type-safe kysely queries based on the search object
    const data = await runSearch(db, searchObject);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
