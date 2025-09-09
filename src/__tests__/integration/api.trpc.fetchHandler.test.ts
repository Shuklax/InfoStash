import { GET } from "@/app/api/trpc/[...trpc]/route";

describe("/api/trpc handler", () => {
  it("responds to GET with a Response", async () => {
    const req = new Request("http://localhost/api/trpc");
    const res = await GET(req as any);
    expect(res).toBeInstanceOf(Response);
  });
});


