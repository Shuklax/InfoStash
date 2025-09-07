import { NextRequest, NextResponse } from "next/server";
import { parseFullTextQuery } from "@/server/lib/llmSearchParser";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const parsed = await parseFullTextQuery(text);
  return NextResponse.json(parsed);
}
