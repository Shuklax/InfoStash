import { GET } from "@/app/api/domains/route";

describe("GET /api/domains", () => {
  it("responds with JSON array", async () => {
    const res = await GET();
    const json: any = await (res as any).json();
    expect(Array.isArray(json)).toBe(true);
  });
});


