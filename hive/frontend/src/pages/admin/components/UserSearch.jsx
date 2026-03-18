import React from "react";

import Icon from "@/components/ui/Icon";

const UserSearch = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
//   error,
}) => {
  return (
    <div className="flex flex-col">
      <div className=" flex gap-2 items-center p-0.5">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by Student Number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 pl-8 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800 text-sm"
          />
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon icon="heroicons-outline:magnifying-glass"  width={20} />
          </span>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-sm py-1 px-3 bg-gray-800 text-white shadow-theme-xs hover:bg-gray-900"
          onClick={handleSearch}
        >
          {/* <Icon icon="heroicons-outline:arrow-path" className="w-5 h-5"/> */}
            Search
        </button>
      </div>

      {/* {error && <p className="text-red-500 text-xs ml-2">{error}</p>} */}
    </div>
  );
};

export default UserSearch;
