import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Notification from "@/components/ui/Notification";
import Icon from "@/components/ui/Icon";
import { getAllStudents, promoteUserToAdmin } from "@/services";

const BUTTON_COLORS = {
  success: { backgroundColor: "#DDF5E6", color: "#1B5133", border: "1px solid #3FB07A" },
};

const PromoteUserToAdmin = ({ isOpen, closeModal, onUserPromoted }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [promotingStudentNumber, setPromotingStudentNumber] = useState(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllStudents();
      setUsers(response || []);
      setFilteredUsers(response || []);
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.studentNumber?.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const handlePromote = async (studentNumber) => {
    setPromotingStudentNumber(studentNumber);
    try {
      const result = await promoteUserToAdmin(studentNumber);
      Notification.success("User promoted to admin successfully!");
      if (result?.warning) {
        Notification.warning(result.warning);
      }
      // Refresh the list
      fetchUsers();
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to promote user");
    } finally {
      setPromotingStudentNumber(null);
      onUserPromoted(); // Callback to refresh admin list
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setFilteredUsers([]);
    closeModal();
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={handleClose}
      title="Promote User to Admin"
      themeClass="bg-white"
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Icon icon="heroicons-outline:search" className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or student number..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users List */}
        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user._id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.studentNumber}</p>
                  </div>
                  <button
                    className="px-3 py-2 text-xs font-medium rounded transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={BUTTON_COLORS.success}
                    onClick={() => handlePromote(user.studentNumber)}
                    disabled={promotingStudentNumber === user.studentNumber}
                  >
                    {promotingStudentNumber === user.studentNumber ? "Promoting..." : "Promote"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            text="Close"
            className="btn-secondary"
            onClick={handleClose}
          />
        </div>
      </div>
    </Modal>
  );
};

export default PromoteUserToAdmin;
