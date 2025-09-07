import { cn } from "@/server/lib/utils";

describe("utils.cn", () => {
  it("keeps the last Tailwind class when conflicting", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges distinct classes", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });
});


