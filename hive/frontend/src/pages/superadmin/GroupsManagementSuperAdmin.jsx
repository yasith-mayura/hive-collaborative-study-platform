import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "@/services";
import Icon from "@/components/ui/Icon";

const BATCH_CARD_COLORS = [
  { bg: "#FFF4CC", border: "#FFCC00", icon: "#4D3D00" },
  { bg: "#EAF9EE", border: "#50C793", icon: "#205D3A" },
  { bg: "#EAF8FF", border: "#0CE7FA", icon: "#0D4B66" },
  { bg: "#F4EEFF", border: "#BDA3FF", icon: "#50337A" },
  { bg: "#FFEFF4", border: "#F68B8D", icon: "#7A3650" },
  { bg: "#FFF1E8", border: "#FA916B", icon: "#7E4520" },
];

const GroupsManagementSuperAdmin = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBatches = async () => {
      setLoading(true);
      try {
        const users = await getAllUsers();
        const usersArray = Array.isArray(users) ? users : [];

        // Group by batch year
        const batchMap = {};
        usersArray.forEach((user) => {
          const batchYear = user.batch || "Unknown";
          if (!batchMap[batchYear]) {
            batchMap[batchYear] = { students: [], admins: [] };
          }
          if (user.role === "admin") {
            batchMap[batchYear].admins.push(user);
          } else if (user.role === "student") {
            batchMap[batchYear].students.push(user);
          }
        });

        // Convert to sorted array (newest batch first)
        const batchList = Object.entries(batchMap)
          .map(([year, data]) => ({
            year,
            label: year !== "Unknown" ? `Batch ${year}` : "Unassigned",
            studentCount: data.students.length,
            adminCount: data.admins.length,
            totalCount: data.students.length + data.admins.length,
            students: data.students.sort((a, b) =>
              (a.name || "").localeCompare(b.name || "")
            ),
            admins: data.admins.sort((a, b) =>
              (a.name || "").localeCompare(b.name || "")
            ),
          }))
          .sort((a, b) => {
            if (a.year === "Unknown") return 1;
            if (b.year === "Unknown") return -1;
            return Number(b.year) - Number(a.year);
          });

        setBatches(batchList);
      } catch (err) {
        console.error("Failed to load batches:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBatches();
  }, []);



  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-secondary-800">
          Groups / Batches
        </h2>
        <p className="text-sm text-secondary-500">
          {batches.length} batch{batches.length !== 1 ? "es" : ""} found
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-secondary-400">
          No batches found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch, index) => {
            const color =
              BATCH_CARD_COLORS[index % BATCH_CARD_COLORS.length];


            return (
              <div
                key={batch.year}
                className="bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer"
                style={{ borderColor: color.border }}
                onClick={() => navigate(`/superadmin/groups/${batch.year}`)}
              >
                <div
                  className="p-5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color.bg }}
                    >
                      <Icon
                        icon="heroicons-outline:user-group"
                        className="w-6 h-6"
                        style={{ color: color.icon }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-secondary-800">
                        {batch.label}
                      </h3>
                      <p className="text-sm text-secondary-500 mt-0.5">
                        {batch.totalCount} member{batch.totalCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                  </div>

                  {/* Stats Row */}
                  <div className="flex gap-4 mt-4">
                    <div
                      className="flex-1 rounded-lg px-3 py-2 text-center"
                      style={{ backgroundColor: color.bg }}
                    >
                      <p className="text-xs text-secondary-500">Students</p>
                      <p className="text-xl font-bold text-secondary-800">
                        {batch.studentCount}
                      </p>
                    </div>
                    <div
                      className="flex-1 rounded-lg px-3 py-2 text-center"
                      style={{ backgroundColor: color.bg }}
                    >
                      <p className="text-xs text-secondary-500">Admins</p>
                      <p className="text-xl font-bold text-secondary-800">
                        {batch.adminCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupsManagementSuperAdmin;