import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function DatasetUpload() {
  return (
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
  );
}
