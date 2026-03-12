
import ResourceCard from "../components/ui/ResourceCard";
import React, { useState } from "react";
import { IoMdDownload } from "react-icons/io";
import { FaRegFileAlt } from "react-icons/fa"
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const pastPapers = [
  { name: "2019 - 2020 SENG 1234", url: "#" },
  { name: "2019 - 2020 SENG 1234", url: "#" },
  { name: "2019 - 2020 SENG 1234", url: "#" },
  { name: "2019 - 2020 SENG 1234", url: "#" }
];

const sharedNotes = [
  { title: "Computer Networks Notes" },
  { title: "Operating Systems Notes" },
  { title: "Database Systems Notes" },
  { title: "Software Engineering Notes" },
  { title: "Computer Networks Notes" },
  { title: "Operating Systems Notes" },
  { title: "Database Systems Notes" },
  { title: "Software Engineering Notes" }
];

export default function Resources() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("papers");

  return (
    <div className="min-h-screen bg-primary ">

      {/* Tabs */}
<div className="flex items-center gap-4 border-b px-6 pt-4">
   <button
        onClick={() => navigate(-1)} 
        className="mb-1 hover:bg-gray-100 rounded-full transition"
        aria-label="Go back"
      >
        <FaArrowLeft size={18} />
      </button>

  <div className="flex gap-6">
    <button
      onClick={() => setActiveTab("papers")}
      className={`pb-2 font-medium transition-colors ${
        activeTab === "papers"
          ? "border-b-2 border-yellow-500 font-semibold"
          : "border-b-2 border-transparent hover:border-yellow-300"
      }`}
    >
      Past Papers
    </button>

    <button
      onClick={() => setActiveTab("notes")}
      className={`pb-2 font-medium transition-colors ${
        activeTab === "notes"
          ? "border-b-2 border-yellow-500 font-semibold"
          : "border-b-2 border-transparent hover:border-yellow-300"
      }`}
    >
      Shared Notes
    </button>
  </div>
</div>

      {/* Past Papers List */}
      {activeTab === "papers" && (
        <div className="p-6 space-y-4">
          {pastPapers.map((paper, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b border-gray-400 pb-3"
            >
              <div className="flex items-center gap-3">
                <FaRegFileAlt />
                <span>{paper.name}</span>
              </div>

              <a href={paper.url}>
                <IoMdDownload size={18} />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Shared Notes Cards */}
      {activeTab === "notes" && (
        <div className="p-8 flex flex-wrap gap-4 items-center justify-center">
          {sharedNotes.map((note, index) => (
            <ResourceCard key={index} item={note} />
          ))}
        </div>
      )}

    </div>
  );
}