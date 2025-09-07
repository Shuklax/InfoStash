import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { PreviewToggle } from "./PreviewToggle";
import { TechCounts } from "./TechCounts";
import { CountryFilter } from "./CountryFilter";
import { CompanyCategoryFilter } from "./CompanyCategoryFilter";
import { TechnologyFilters } from "./TechnologyFilters";
import { RunAndReset } from "./RunAndReset";
import { DomainFilter } from "./DomainFilter";
import { NameFilter } from "./NameFilter";

export default function SearchBuilder() {
  
  return (
    <>
      <ScrollArea
        id="search-builder"
        className="p-5 border-2 rounded-2xl h-[88vh]"
      >
        <div>
          <p className="text-2xl font-sans font-bold mb-2">Search Builder</p>

          {/* Component containing the "Run search" and "reset" functionality */}
          <RunAndReset />
        </div>

        <div className="font-sans mt-4 mb-3">
          {/* contains domain based filter */}
          <DomainFilter />
           
          <Separator className="my-4" />

          {/* contains name based filter */}
          <NameFilter />
           
          <Separator className="my-4" />

          {/* contains contry based filter */}
          <CountryFilter />
           
          <Separator className="my-4" />

          {/* contains company category based filter */}
          <CompanyCategoryFilter />
        </div>

        <Separator className="my-4" />
        {/* contains technology based filter */}
        <TechnologyFilters />
        <Separator className="my-4" />

        <div>
          {/* this inputs the tech. count and tech. per category count */}
          <TechCounts />

          <Separator />
          <RunAndReset />
          <Separator />

          {/* Shows a live preview of the search object being built above.
          If you hit "run search", the search results will also be shown below. */}
          {/* <PreviewToggle /> */}
        </div>

      </ScrollArea>
    </>
  );
}
