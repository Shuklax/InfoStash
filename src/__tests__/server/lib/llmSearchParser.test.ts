import { parseFullTextQuery } from "@/server/lib/llmSearchParser";

jest.mock("openai", () => ({
  __esModule: true,
  default: class MockOpenAI {
    chat = { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({ foo: "bar" }) } }] }) } };
  }
}));

describe("parseFullTextQuery (unit)", () => {
  it("returns JSON", async () => {
    const res = await parseFullTextQuery("hello");
    expect(res.foo).toBe("bar");
  });
});


