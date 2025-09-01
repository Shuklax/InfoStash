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

export default function Sidebar() {
  return (
    <div id="sidebar" className="m-6">
      <div className="p-5 border-2 rounded-2xl">
        <p className="text-xl font-bold mb-4 font-sans">Dataset Upload</p>
        <div className="flex ">
          <Input type="file" />
          <Button variant="outline" className="px-2 font-semibold ml-2">
            Reset
          </Button>
        </div>
        <p className="font-sans text-[15px] mt-4 opacity-60">
          Failed to parse JSON. Ensure it is an array of objects
        </p>
      </div>

      <ScrollArea id="search-builder" className="p-5 border-2 mt-4 rounded-2xl">
        <p className="text-xl font-sans font-bold mb-2">Search Builder</p>
        <div className="flex justify-around font-sans mt-4 mb-3">
          <div>
            <div className="font-semibold mb-1">Country</div>
            <div>
              <Select>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1">Company Category</div>
            <div>
              <Select>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <Separator />
        <div className="my-4">
          <div className="font-semibold mb-1 font-sans">Technology Filters</div>
          <div>
            <Input
              className="border-2"
              placeholder="Type to search technologies..."
            />
          </div>
          <div className="mt-5 flex justify-around font-sans font-semibold">
            <div>AND</div>
            <div>OR</div>
            <div>NOT</div>
          </div>
        </div>
        <Separator />
        <div className="my-4">
          <div className="flex justify-around font-sans mt-4 mb-3">
            <div>
              <div className="font-semibold mb-1">Total Technologies</div>
              <div>
                <Select>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">
                Technologies per <br />
                Category
              </div>
              <div>
                <Select>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex my-4 justify-around">
            <Button className="font-sans font-semibold">Run Search</Button>
            <Button variant="outline">Reset Filters</Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
