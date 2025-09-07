import { POST } from "@/app/api/llm-parse/route";

// Mock server/lib/llmSearchParser to avoid network calls
jest.mock("@/server/lib/llmSearchParser", () => ({
  parseFullTextQuery: async (text: string) => ({ text })
}));

describe("POST /api/llm-parse", () => {
  it("returns parsed result", async () => {
    const req = new Request("http://localhost/api/llm-parse", {
      method: "POST",
      body: JSON.stringify({ text: "hello" })
    });
    const res = await POST(req as any);
    const json: any = await (res as any).json();
    expect(json.text).toBe("hello");
  });
});


