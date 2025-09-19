import { NextRequest, NextResponse } from "next/server";
import { parseFullTextQuery } from "@/server/lib/llmSearchParser";

// API route to handle parsing of full-text search queries using LLM
// Expects a POST request with JSON body containing { text: string }
// Returns the structured query as JSON
export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const parsed = await parseFullTextQuery(text);
  return NextResponse.json(parsed);
}
