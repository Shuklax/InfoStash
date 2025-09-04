import { NextResponse } from "next/server";
import db from "@/lib/db";          // your Kysely instance
import {runSearch} from "@/lib/search";

export async function POST(req: Request) {
  try {
    const searchObject = await req.json();
    const data = await runSearch(db, searchObject);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
