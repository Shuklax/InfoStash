import { useSearchHistoryStore } from "@/store/searchStore";

describe("useSearchHistoryStore integration", () => {
  it("toggles sheet open state", () => {
    const { historySheetOpen, setHistorySheetOpen } = useSearchHistoryStore.getState() as any;
    expect(historySheetOpen).toBe(false);
    setHistorySheetOpen(true);
    expect(useSearchHistoryStore.getState().historySheetOpen).toBe(true);
  });
});


