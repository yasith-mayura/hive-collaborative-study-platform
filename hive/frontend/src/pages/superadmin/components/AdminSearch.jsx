import React from "react";
import Icon from "@/components/ui/Icon";

const AdminSearch = ({ searchQuery, setSearchQuery, handleSearch }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 items-center">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by Name, Email, or Student No."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full p-2 pl-8 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800 text-sm"
          />
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon icon="heroicons-outline:magnifying-glass" width={20} />
          </span>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md py-2 px-4 bg-gray-800 text-white shadow-sm hover:bg-gray-900 whitespace-nowrap shrink-0"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default AdminSearch;
