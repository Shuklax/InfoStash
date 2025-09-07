import { parseFullTextQuery } from "@/server/lib/llmSearchParser";

jest.mock("openai", () => ({
  __esModule: true,
  default: class MockOpenAI {
    chat = {
      completions: {
        create: async () => ({ choices: [{ message: { content: JSON.stringify({ ok: true }) } }] })
      }
    }
  }
}));

describe("llmSearchParser integration", () => {
  it("returns JSON from OpenAI client", async () => {
    const out = await parseFullTextQuery("x");
    expect(out.ok).toBe(true);
  });
});


