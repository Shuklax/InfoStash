"use client";

import { useSearchStore } from "@/store/searchStore";
import { Button } from "./ui/button";
import { Download, FileCode } from "lucide-react";
import { toast } from "sonner";

export default function ExportViewControls() {
  const results = useSearchStore((state) => state.results);

  const downloadJSON = () => {
    if (!results || results.length === 0) {
      toast.error("No data available to export");
      return null;
    }
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "exported_data.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const downloadCSV = () => {
    if (!results || results.length === 0) {
      toast.error("No data available to export");
      return null;
    }
    const replacer = (key: string, value: any) => (value === null ? "" : value);
    const header = Object.keys(results[0] || {});
    const csv = [
      header.join(","),
      ...results.map((row) =>
        header
          .map((fieldName) =>
            JSON.stringify(row[fieldName as keyof typeof row], replacer)
          )
          .join(",")
      ),
    ].join("\r\n");
    const csvData = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const exportFileDefaultName = "exported_data.csv";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", csvData);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div
      id="export-view-pageLength-controller"
      className="flex justify-between font-sans"
    >
      <div>
        <Button
          variant="outline"
          size="sm"
          className="font-semibold"
          onClick={downloadJSON}
        >
          <Download />
          Export in JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="font-semibold mx-2"
          onClick={downloadCSV}
        >
          <FileCode />
          Export in CSV
        </Button>
      </div>

      <div className="flex">
        {/* <div>
          <Select>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              <SelectItem value="tabke">Table</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>
    </div>
  );
}
