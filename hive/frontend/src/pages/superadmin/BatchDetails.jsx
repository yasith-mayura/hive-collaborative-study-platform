import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllUsers } from "@/services";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";

export default function BatchDetails() {
  const { batchYear } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { label: "Name", field: "name" },
    { label: "Email", field: "email" },
    { label: "Student Number", field: "studentNumber" },
    { label: "Role", field: "role" },
  ];

  useEffect(() => {
    const loadMembers = async () => {
      setLoading(true);
      try {
        const users = await getAllUsers();
        const usersArray = Array.isArray(users) ? users : [];

        const batchMembers = usersArray
          .filter((user) => {
            const userBatch = user.batch ? String(user.batch) : "Unknown";
            return userBatch === batchYear;
          })
          .filter((user) => user.role === "student" || user.role === "admin")
          .sort((a, b) => {
            // Admins first, then students; alphabetical within each group
            if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
            return (a.name || "").localeCompare(b.name || "");
          });

        setMembers(batchMembers);
      } catch (err) {
        console.error("Failed to load batch members:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [batchYear]);

  const label = batchYear !== "Unknown" ? `Batch ${batchYear}` : "Unassigned";
  const studentCount = members.filter((m) => m.role === "student").length;
  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/superadmin/groups")}
          className="p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Go back"
        >
          <Icon
            icon="heroicons-outline:arrow-left"
            className="w-5 h-5 text-secondary-600"
          />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-secondary-800">{label}</h2>
          <p className="text-sm text-secondary-500">
            {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
            {studentCount} student{studentCount !== 1 ? "s" : ""} ·{" "}
            {adminCount} admin{adminCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Table */}
      <Card noborder>
        <div className="relative">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100 table-fixed">
                    <thead>
                      <tr>
                        {columns.map((column, i) => (
                          <th
                            key={i}
                            scope="col"
                            className="table-th font-medium text-base"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {members.length > 0 ? (
                        members.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="table-td font-medium text-gray-900">
                              {row.name}
                            </td>
                            <td className="table-td lowercase">{row.email}</td>
                            <td className="table-td">{row.studentNumber}</td>
                            <td className="table-td">
                              <span
                                className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                  row.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {row.role}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="text-center py-10 text-secondary-400"
                          >
                            No members found in this batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
