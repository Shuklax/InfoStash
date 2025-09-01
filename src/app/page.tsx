import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ExportViewControls from "@/components/ExportViewControls";
import ResultsTable from "@/components/ResultsTable";
import TechDistribution from "@/components/TechDistribution";

export default function Home() {
  return (
    <div>
      <Header />
        <div id="body" className="grid grid-cols-10">
          <div className="col-span-2 flex">
            <Sidebar />
          </div>
          <main className="col-span-8 mr-6">
            
              <ExportViewControls />
              <ResultsTable />
              <TechDistribution />
            
          </main>
        </div>
    </div>
  );
}
