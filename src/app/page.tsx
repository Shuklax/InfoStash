import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
//import ExportViewControls from "@/components/ExportViewControls";
import ResultsTable from "@/components/ResultsTable";
//import TechDistribution from "@/components/TechDistribution";

export default function Home() {
  return (
    <div>
      <Header />
        <div id="body" className="grid grid-cols-12">
          <div className="col-span-3 flex">
            <Sidebar />
          </div>
          <main className="col-span-9 mr-6">
            
              {/* <ExportViewControls /> */}
              <ResultsTable />

              {/* Future Feature: If we wanna show a graphical distribution of the tech in the search results */}
              {/* <TechDistribution /> */}
            
          </main>
        </div>
    </div>
  );
}
