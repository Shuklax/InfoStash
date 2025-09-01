import { Input } from "./ui/input";

export default function Header() {
  return (
    <header>
      <div className="flex justify-between items-center p-3 border">
        <div className="text-[20px] font-bold font-sans text-xl underline italic">
          Built-With
        </div>
        <div className="flex justify-center w-96">
          <Input
            placeholder="Search companies, domains or technologies"
            className="w-64"
          />
        </div>
        <div className="mr-10 font-sans">No Dataset Loaded</div>
      </div>
    </header>
  );
}
