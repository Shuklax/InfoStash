import { GET } from "@/app/api/categories/route";

describe("GET /api/categories", () => {
  it("responds with JSON array", async () => {
    const res = await GET();
    const json: any = await (res as any).json();
    expect(Array.isArray(json)).toBe(true);
  });
});


