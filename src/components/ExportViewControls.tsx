import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ExportViewControls(){
    return (
        <div id="export-view-pageLength-controller" className="flex justify-between p-5 mt-6 mb-4 border-2 rounded-2xl font-sans">
              <div>
                <Select>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Export in JSON</SelectItem>
                    <SelectItem value="dark">Export in CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Export in JSON</SelectItem>
                    <SelectItem value="dark">Export in CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Table</SelectItem>
                    <SelectItem value="dark">Grid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
    )
}