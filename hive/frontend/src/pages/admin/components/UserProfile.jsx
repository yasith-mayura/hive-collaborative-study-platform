import React, { useState } from "react";
import Icon from "@/components/ui/Icon";

const UserProfile = ({ user, onClose, onDelete, onUpdate }) => {
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    studentNumber: user?.studentNumber || "",
    level: user?.batch ? `Level ${new Date().getFullYear() - user.batch + 1}` : "",
    email: user?.email || "",
  });

  const handleEditClick = (field) => {
    setEditingField(editingField === field ? null : field);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = () => {
    onUpdate?.({
      name: formData.name,
      studentNumber: formData.studentNumber,
      email: formData.email,
    });
  };

  const handleDelete = () => {
    onDelete?.(user?.studentNumber);
  };

  const fields = [
    { key: "name", label: "Student Name" },
    { key: "studentNumber", label: "Student Number" },
    { key: "level", label: "Level", readOnly: true },
    { key: "email", label: "Email" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Back header */}
      <div className="flex items-center gap-3 mb-6">
        {/* <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 transition cursor-pointer"
        >
          <Icon icon="heroicons-outline:arrow-left" className="text-gray-700 w-5 h-5" />
        </button> */}
        <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
      </div>

      {/* Profile Picture */}
      <div className="flex justify-start mb-8">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon icon="heroicons-outline:link" className="text-gray-300 w-8 h-8" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-gray-600 transition">
            <Icon icon="heroicons-outline:pencil" className="text-white w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-1 flex-1">
        {fields.map(({ key, label, readOnly }) => (
          <div
            key={key}
            className="flex items-center py-3 border-b border-gray-100"
          >
            <span className="w-36 text-sm text-gray-500 shrink-0">{label}</span>
            <div className="flex-1 flex items-center gap-2">
              {editingField === key && !readOnly ? (
                <input
                  type="text"
                  value={formData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="flex-1 text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm text-gray-900">{formData[key]}</span>
              )}
              {!readOnly && (
                <button
                  onClick={() => handleEditClick(key)}
                  className="p-1 rounded hover:bg-gray-100 transition cursor-pointer"
                >
                  <Icon
                    icon={editingField === key ? "heroicons-outline:check" : "heroicons-outline:pencil"}
                    className="text-gray-400 w-4 h-4"
                  />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-8 pt-4">
        <button
          onClick={handleDelete}
          className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition cursor-pointer"
        >
          Delete
        </button>
        <button
          onClick={handleUpdate}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition cursor-pointer"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default UserProfile;