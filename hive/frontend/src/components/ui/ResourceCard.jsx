import React from "react";
import { IoIosNotifications } from "react-icons/io";
export default function ResourceCard({ item }) {
  return (
    <div className="relative w-62 h-42 bg-white rounded-md overflow-hidden group shadow-2xl flex flex-col">
      
      {/* Image Section */}
      <div className="h-28 relative shrink-0">
        <img
          src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4"
          alt={item.title}
          className="w-full h-full object-cover"
        />

      </div>

      {/* Title */}
      <div className="px-4 py-3 bg-[#e7e2d3] flex-1 flex items-center justify-between">
        <h3 className="text-sm text-blue-900 font-semibold justify-between ">
          {item.title}
        </h3>
        <IoIosNotifications />
      </div>

    </div>
  );
}