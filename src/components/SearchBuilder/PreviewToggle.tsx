"use client"

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useSearchStore } from "../../store/searchStore";

export function PreviewToggle(){
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  //Pull the entire global search state from zustand
  const searchObject = useSearchStore((state)=>state);

  // copy function
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(searchObject, null, 2));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-around mt-6 font-semibold">
        <div>Search Object(debug)</div>
        <div 
          className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
        >
          Preview 
          <ChevronDown 
            className={`size-5 transition-transform duration-200 ${
              isPreviewOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </div>
      </div>
      
      {isPreviewOpen && (
        <div className="bg-gray-100 w-full h-auto my-3 rounded-lg p-4">
          <pre className="text-sm overflow-x-auto whitespace-pre">
            <code className="language-json">
              {JSON.stringify(searchObject, null, 2)}
            </code>           
          </pre>
        </div>
      )}
    </div>
  );
};

export default PreviewToggle;