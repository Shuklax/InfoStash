import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatasetUpload from "./DatasetUpload";
import SearchBuilder from "./SearchBuilder";

export default function Sidebar() {
  return (
    <div id="sidebar" className="m-6">
      <DatasetUpload/>

      <SearchBuilder/>
    </div>
  );
}
