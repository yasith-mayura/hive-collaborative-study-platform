import React, { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";

const BUTTON_COLORS = {
  primary: { backgroundColor: "#DDF2FF", color: "#0A435B", border: "1px solid #00BFD8" },
  warning: { backgroundColor: "#FBEAB4", color: "#4A3A00", border: "1px solid #D9A900" },
  danger: { backgroundColor: "#F9DEE8", color: "#6F2F47", border: "1px solid #E07C9C" },
};

const AdminProfile = ({ admin, onClose, onDelete, onDemote, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: admin?.name || "",
    studentNumber: admin?.studentNumber || "",
    email: admin?.email || "",
  });

  useEffect(() => {
    setFormData({
      name: admin?.name || "",
      studentNumber: admin?.studentNumber || "",
      email: admin?.email || "",
    });
    setIsEditing(false);
  }, [admin]);

  const hasChanges = useMemo(() => {
    return (
      formData.name !== (admin?.name || "") ||
      formData.studentNumber !== (admin?.studentNumber || "") ||
      formData.email !== (admin?.email || "")
    );
  }, [formData, admin]);

  const handleSave = () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    onUpdate?.(admin?.studentNumber, {
      name: formData.name,
      studentNumber: formData.studentNumber,
      email: formData.email,
    });
  };

  const fields = [
    { key: "name", label: "Admin Name", value: formData.name, editable: true },
    { key: "studentNumber", label: "Student Number", value: formData.studentNumber, editable: true },
    { key: "email", label: "Email", value: formData.email, editable: true },
    { key: "role", label: "Role", value: admin?.role },
    { key: "batch", label: "Batch", value: admin?.batch || "N/A" },
  ];

  return (
    <div className="flex flex-col h-full p-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{admin?.name}</h2>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 transition">
          <Icon icon="heroicons-outline:x-mark" className="text-gray-700 w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-start mb-8">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden text-white font-bold text-2xl">
            {admin?.name?.split(" ").map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {fields.map(({ key, label, value, editable }) => (
          <div key={key}>
            <label className="text-xs text-gray-500">{label}</label>
            {isEditing && editable ? (
              <input
                value={value || ""}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, [key]: event.target.value }))
                }
                className="w-full mt-1 px-3 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            ) : (
              <p className="text-sm font-medium text-gray-800">{value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-8 pt-4 border-t">
        <button
          onClick={() => onDelete(admin?.studentNumber)}
          className="px-6 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-90 cursor-pointer"
          style={BUTTON_COLORS.danger}
        >
          Deactivate Admin
        </button>
        <button
          onClick={() => onDemote?.(admin?.studentNumber)}
          className="px-6 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-90 cursor-pointer"
          style={BUTTON_COLORS.warning}
        >
          Demote to User
        </button>
        <button
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className="px-6 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-90 cursor-pointer"
          style={BUTTON_COLORS.primary}
        >
          {isEditing ? "Save" : "Update"}
        </button>
      </div>
    </div>
  );
};

export default AdminProfile;
