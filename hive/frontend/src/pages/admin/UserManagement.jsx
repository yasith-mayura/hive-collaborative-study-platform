import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Drawer from "@/components/ui/Drawer";
import Notification from "@/components/ui/Notification";
import UserProfile from "@/pages/admin/components/UserProfile";
import UserSearch from "@/pages/admin/components/UserSearch";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { getAllUsers, getUserByStudentNumber, deleteUser, updateUser } from "@/services";

const BUTTON_COLORS = {
  primary: { backgroundColor: "#DDF2FF", color: "#0A435B", border: "1px solid #00BFD8" },
  danger: { backgroundColor: "#F9DEE8", color: "#6F2F47", border: "1px solid #E07C9C" },
};

function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns = [
    { label: "Name", field: "name" },
    { label: "Email", field: "email" },
    { label: "Role", field: "role" },
    { label: "Student Number", field: "studentNumber" },
    { label: "Actions", field: "actions" },
  ];

  const fetchUsers = async () => {
    setFetchLoading(true);
    try {
      const response = await getAllUsers();
      // Filter to show only students (not admins or superadmins)
      const studentsOnly = (response || []).filter(user => user.role === 'student');
      setUsers(studentsOnly);
      setFilteredUsers(studentsOnly);
    } catch (error) {
      Notification.error(error.message || "Failed to fetch users");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.studentNumber?.toLowerCase().includes(lowercasedQuery) ||
        user.name?.toLowerCase().includes(lowercasedQuery) ||
        user.email?.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredUsers(filtered);
  };

  const handleClick = async (studentNumber) => {
    try {
      const response = await getUserByStudentNumber(studentNumber);
      setSelectedUser(response);
      setOpenDrawer(true);
    } catch (error) {
      Notification.error(error.message || "Failed to fetch user details");
    }
  };

  const handleDrawerClose = () => {
    setOpenDrawer(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (studentNumber) => {
    setUserToDelete(studentNumber);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      const result = await deleteUser(userToDelete);
      Notification.success("User deactivated successfully");
      if (result?.warning) {
        Notification.warning(result.warning);
      }
      handleDrawerClose();
      fetchUsers(); // Refresh the user list
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUpdateUser = async (currentStudentNumber, payload) => {
    try {
      const result = await updateUser(currentStudentNumber, payload);
      Notification.success("User updated successfully");
      if (result?.warning) {
        Notification.warning(result.warning);
      }
      handleDrawerClose();
      fetchUsers();
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to update user");
    }
  };

  return (
    <>
      <div className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-full max-w-sm">
            <UserSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
            />
          </div>
        </div>

        <Card noborder>
          <div className="relative">
            {fetchLoading ? (
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
                            <th key={i} scope="col" className="table-th font-medium text-base">
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td
                                className="table-td cursor-pointer font-medium text-gray-900"
                                onClick={() => handleClick(row.studentNumber)}
                              >
                                {row.name}
                              </td>
                              <td className="table-td lowercase">{row.email}</td>
                              <td className="table-td">
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">
                                  {row.role}
                                </span>
                              </td>
                              <td className="table-td">{row.studentNumber}</td>
                              <td className="table-td">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleClick(row.studentNumber)}
                                    className="px-3 py-1 text-xs font-medium rounded transition-opacity hover:opacity-90"
                                    style={BUTTON_COLORS.primary}
                                  >
                                    Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(row.studentNumber)}
                                    className="px-3 py-1 text-xs font-medium rounded transition-opacity hover:opacity-90"
                                    style={BUTTON_COLORS.danger}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={columns.length} className="text-center py-10">
                              No users found.
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

      <Drawer
        title=""
        activeModal={openDrawer}
        onClose={handleDrawerClose}
        themeClass="max-w-[500px]"
      >
        {selectedUser && (
          <UserProfile
            user={selectedUser}
            onClose={handleDrawerClose}
            onDelete={handleDeleteUser}
            onUpdate={handleUpdateUser}
          />
        )}
      </Drawer>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteUser}
        isLoading={deleteLoading}
        title="Deactivate Student"
        message="Are you sure you want to deactivate this student? They will no longer have access to the platform."
      />
    </>
  );
}

export default Users;
