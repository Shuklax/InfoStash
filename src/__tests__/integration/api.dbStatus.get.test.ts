import { GET } from "@/app/api/db-status/route";

describe("GET /api/db-status", () => {
  it("returns hasData key", async () => {
    const res = await GET();
    const json: any = await (res as any).json();
    expect(json).toHaveProperty("hasData");
  });
});


