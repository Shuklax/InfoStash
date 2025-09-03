import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { PreviewToggle } from "./PreviewToggle";
import { TechCounts } from "./TechCounts";
import { CountryFilter } from "./CountryFilter";
import { CompanyCategoryFilter } from "./CompanyCategoryFilter";
import { TechnologyFilters } from "./TechnologyFilters";
import { RunAndReset } from "./RunAndReset";

export default function SearchBuilder() {
  return (
    <>
      <ScrollArea
        id="search-builder"
        className="p-5 border-2 rounded-2xl h-[88vh]"
      >
        <div>
          <p className="text-2xl font-sans font-bold mb-2">Search Builder</p>
          <RunAndReset />
        </div>
        <div className="font-sans mt-4 mb-3">
          <CountryFilter />
          <Separator className="my-4" />
          <CompanyCategoryFilter />
        </div>
        <Separator className="my-4" />
        <TechnologyFilters />
        <Separator className="my-4" />
        <div>
          <TechCounts />
          <Separator />
          <RunAndReset />
          <Separator />
          <PreviewToggle />
        </div>
      </ScrollArea>
    </>
  );
}
