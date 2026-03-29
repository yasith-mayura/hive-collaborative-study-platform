import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Drawer from "@/components/ui/Drawer";
import Notification from "@/components/ui/Notification";
import UserProfile from "@/pages/admin/components/UserProfile";
import UserSearch from "@/pages/admin/components/UserSearch";
import { getAllUsers, getUserByStudentNumber, deleteUser, updateUser } from "@/services";
import AddNewUserModel from "@/pages/admin/components/AddNewUser";

function UserManagementSuperAdmin() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openModel, setOpenModel] = useState(false);

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

  // Extract unique batch years for the filter dropdown
  const batchOptions = [...new Set(users.map((u) => u.batch).filter(Boolean))]
    .sort((a, b) => b - a);

  const applyFilters = (search, batch) => {
    let result = users;

    if (batch) {
      result = result.filter((user) => String(user.batch) === String(batch));
    }

    if (search) {
      const lowercasedQuery = search.toLowerCase();
      result = result.filter(
        (user) =>
          user.studentNumber?.toLowerCase().includes(lowercasedQuery) ||
          user.name?.toLowerCase().includes(lowercasedQuery) ||
          user.email?.toLowerCase().includes(lowercasedQuery)
      );
    }

    setFilteredUsers(result);
  };

  const handleSearch = () => {
    applyFilters(searchQuery, batchFilter);
  };

  const handleBatchChange = (value) => {
    setBatchFilter(value);
    applyFilters(searchQuery, value);
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
    try {
      const result = await deleteUser(studentNumber);
      Notification.success("User deactivated successfully");
      if (result?.warning) {
        Notification.warning(result.warning);
      }
      handleDrawerClose();
      fetchUsers();
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to delete user");
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
        {/* Row 1: Add New User button */}
        <div className="flex justify-end mb-4">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-sm py-2 px-4 bg-gray-800 text-white shadow-theme-xs hover:bg-gray-900"
            onClick={() => setOpenModel(true)}
          >
            <Icon icon="heroicons-outline:plus" className="w-5 h-5" />
            Add New User
          </button>
        </div>

        {/* Row 2: Filter (left) + Search (right) */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <select
            value={batchFilter}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-secondary-700 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">All Batches</option>
            {batchOptions.map((batch) => (
              <option key={batch} value={batch}>
                Batch {batch}
              </option>
            ))}
          </select>
          <div className="relative w-full max-w-sm">
            <UserSearch
              searchQuery={searchQuery}
              setSearchQuery={(val) => {
                setSearchQuery(val);
                applyFilters(val, batchFilter);
              }}
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
                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                  >
                                    Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(row.studentNumber)}
                                    className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
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

      <AddNewUserModel
        isOpen={openModel}
        closeModal={() => setOpenModel(false)}
        onUserAdded={fetchUsers}
      />
    </>
  );
}

export default UserManagementSuperAdmin;