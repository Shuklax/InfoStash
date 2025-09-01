import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ExportViewControls from "@/components/ExportViewControls";
import ResultsTable from "@/components/ResultsTable";
import TechDistribution from "@/components/TechDistribution";

export default function Home() {
  return (
    <div>
      <Header/>
      <body>
        <div id="body" className="flex">
          <Sidebar/>
          <main>
            <ExportViewControls/>
            <ResultsTable/>
            <TechDistribution/>
          </main>
        </div>
      </body>
    </div>
  );
}
