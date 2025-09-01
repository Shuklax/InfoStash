import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import { Download, FileCode } from "lucide-react";

export default function ExportViewControls() {
  return (
    <div
      id="export-view-pageLength-controller"
      className="flex justify-between p-5 mt-6 mb-4 border-2 rounded-2xl font-sans"
    >
      <div>
        <Button variant="outline" size="sm" className="font-semibold">
          <Download />
          Export in JSON
        </Button>
        <Button variant="outline" size="sm" className="font-semibold mx-2">
          <FileCode />
          Export in CSV
        </Button>
      </div>

      <div className="flex">
        <div className="mx-2">
          <Select>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Page Size" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="75">75</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              <SelectItem value="tabke">Table</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
