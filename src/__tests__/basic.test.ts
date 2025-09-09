import { cn } from "@/server/lib/utils";

describe("Basic test", () => {
  test("adds numbers", () => {
    expect(1 + 2).toBe(3);
  });

  test("can import from @/ paths", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
  