
import DatasetUpload from "./SearchBuilder/DatasetUpload";
import SearchBuilder from "./SearchBuilder/SearchBuilder";

export default function Sidebar() {
  return (
    <div id="sidebar" className="m-6 w-full">
      <SearchBuilder/>    

      {/* Future Feature: If you wanna upload the dataset yourself instead of downloading from the web */}
      {/* <DatasetUpload/> */}
    </div>
  );
}
