import { cn } from "@/server/lib/utils";

describe("utils.cn integration", () => {
  it("merges classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});


