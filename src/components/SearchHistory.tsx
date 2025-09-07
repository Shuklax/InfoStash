"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSearchHistoryStore } from "@/store/searchStore";

type HistoryEntry = {
  searchObject: any;
  timestamp: string;
};

export function SearchHistory() {
  const historySheetOpen = useSearchHistoryStore(
    (state) => state.historySheetOpen
  );
  const setHistorySheetOpen = useSearchHistoryStore(
    (state) => state.setHistorySheetOpen
  );

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("searchHistory");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, [historySheetOpen]); // refresh when sheet opens

  return (
    <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your recent searches</SheetTitle>
          <SheetDescription>
            Review and manage your recent search history.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          {history.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {history.map((entry, index) => (
                <AccordionItem key={index} value={`search-${index}`}>
                  <AccordionTrigger>
                    {new Date(entry.timestamp).toLocaleString()}
                  </AccordionTrigger>
                  <AccordionContent>
                    <pre className="text-sm bg-gray-100 p-2 rounded-md overflow-x-auto">
                      {JSON.stringify(entry.searchObject, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-gray-500 text-sm">
              No searches saved yet.
            </p>
          )}
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
