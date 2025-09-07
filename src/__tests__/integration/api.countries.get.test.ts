import { GET } from "@/app/api/countries/route";

describe("GET /api/countries", () => {
  it("responds with JSON array", async () => {
    const res = await GET();
    const json: any = await (res as any).json();
    expect(Array.isArray(json)).toBe(true);
  });
});


