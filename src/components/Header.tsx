import { Input } from "./ui/input";

export default function Header() {
  return (
    <header>
      <div className="flex justify-between p-3 border-b-1">
        <div className="text-[20px] font-bold font-sans text-xl underline italic">
          Built-With
        </div>
        <div className="">
          <Input
            placeholder="Search companies, domains or technologies"
            className="w-xl"
          />
        </div>
        <div className="mr-10 font-sans">No Dataset Loaded</div>
      </div>
    </header>
  );
}
