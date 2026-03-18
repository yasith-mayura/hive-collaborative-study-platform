import React, { useState, useEffect } from "react";

import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Drawer from "@/components/ui/Drawer";
import Notification from "@/components/ui/Notification";

import UserProfile from "@/pages/admin/components/UserProfile";
import UserSearch from "@/pages/admin/components/UserSearch";
import { useAuth } from "@/context/authContext";
import { getAllUsers, getUserByStudentNumber, deleteUser } from "@/services";
import AddNewUserModel from "./components/AddNewUser";

const responseData = {
  code: "OK",
  data: {
    result: [
      {
        resourceId: "7e6ffa01-ad66-48cb-001",
        name: "Dilshan Perera",
        email: "dilshan.perera@moneta.lk",
        role: "OWNER",
        status: "A",
      },
      {
        resourceId: "7e6ffa01-ad66-48cb-002",
        name: "Anushka Fernando",
        email: "anushka.fernando@moneta.lk",
        role: "ADMIN",
        status: "P",
      },
      // {
      //   "resourceId": "7e6ffa01-ad66-48cb-003",
      //   "name": "Sahan Jayawardena",
      //   "email": "sahan.jayawardena@moneta.lk",
      //   "role": "EMPLOYEE",
      //   "status": "I"
      // },
      {
        resourceId: "7e6ffa01-ad66-48cb-004",
        name: "Tharushi Weerasinghe",
        email: "tharushi.weera@moneta.lk",
        role: "ADMIN",
        status: "A",
      },
      {
        resourceId: "7e6ffa01-ad66-48cb-005",
        name: "Kasun Abeywickrama",
        email: "kasun.abey@moneta.lk",
        role: "EMPLOYEE",
        status: "P",
      },
    ],
    total: 5,
  },
  message: "OK",
  requestId: "3f45b861-9e30-450c-9e56-a4f754ba7c1c",
  resourceId: "7e6ffa01-ad66-48cb",
};

function Users() {
  const [users, setUsers] = useState([]); // Users list state
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  const [fetchLoading, setFetchLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const[openModel, setOpenModel] = useState(false);

  const { authData } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const columns = [
    { label: "Name", field: "Name" },
    { label: "Email", field: "Email" },
    { label: "Role", field: "Role" },
    { label: "Student Number", field: "studentNumber" },
    // { label: "Action", field: "Action" },
  ];

  // Fetch users on component mount and when currentPage changes
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // Function to fetch users from API
  const fetchUsers = async (page) => {
    setFetchLoading(true);
    try {
      const response = await getAllUsers({ page });

      setUsers(response || []); // Update users list
      setTotalPages(Math.ceil(response.data?.total / ITEMS_PER_PAGE) || 1); // Update total pages based on API response

      console.log(response);

      // }
    } catch (error) {
      Notification.error(error.message || "Failed to fetch users");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleClick = async (studentNumber) => {
    try {
      const response = await getUserByStudentNumber(studentNumber);
      setSelectedUser(response);
      setOpenDrawer(true);
    } catch (error) {
      Notification.error(error.message || "Failed to fetch user");
    }
  };

  const handleDrawerClose = () => {
    setOpenDrawer(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (studentNumber) => {
    try {
      await deleteUser(studentNumber);
      Notification.success("User deleted successfully");
      handleDrawerClose();
      fetchUsers(currentPage);
    } catch (error) {
      Notification.error(error.message || "Failed to delete user");
    }
  };

  const handleUpdateUser = async (updatedData) => {
    // TODO: wire up when update API is available
    Notification.success("User updated successfully");
    handleDrawerClose();
    fetchUsers(currentPage);
  };

  const handleSearch = () => {
    if (!searchQuery) {
      setCurrentPage(1);
      setIsFiltered(false);
      fetchCandidates(1, "");
    } else if (!validateEmail(searchQuery)) {
      setError("Please enter a valid email address.");
    } else {
      setError("");
      setCurrentPage(1);
      setIsFiltered(true);
      fetchCandidates(1, searchQuery);
    }
  };

  return (
    <>
      <div className="overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <UserSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              // error={searchError}
            />
          </div>

          <div className="flex items-center justify-between py-4">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-sm py-1 px-3 bg-gray-800 text-white shadow-theme-xs hover:bg-gray-900"
              onClick={() => {
                // setSelectedUser(null);
                setOpenModel(true);
              }}
            >
              Add New User
            </button>
          </div>
        </div>
        {/* User Table */}
        <Card noborder>
          <div className="relative">
            <>
              {fetchLoading ? (
                <div className="flex justify-center items-center h-15 m-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-6 border-gray-300 border-t-gray-600"></div>
                  <p className="m-2 text-gray-600">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-100 table-fixed  ">
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
                        <tbody className="bg-white divide-y divide-slate-50">
                          {users.length > 0 ? (
                            users?.map((row, i) => (
                              <tr key={i} className="">
                                <td
                                  className="table-td cursor-pointer"
                                  onClick={() => handleClick(row.studentNumber)}
                                >
                                  <span className="truncate block text-sm">
                                    {row.name}
                                  </span>
                                </td>
                                <td className="table-td normal-case">
                                  {row.email}
                                </td>
                                <td className="table-td ca normal-case">
                                  {row.role}
                                </td>
                                <td className="table-td normal-case">
                                  {row.studentNumber}
                                </td>
                                {/* <td
                                  className="table-td normal-case text-center cursor-pointer"
                                  onClick={() =>
                                    handleDelete(row.studentNumber)
                                  }
                                >
                                  <Icon
                                    icon="heroicons-outline:trash"
                                    className="w-5 h-5 text-red-500 hover:text-red-700 transition mr-10"
                                  />
                                </td> */}
                              </tr>
                            ))
                          ) : (
                            <tr className="">
                              <td
                                colSpan="4"
                                className="table-td normal-case text-center"
                              >
                                No candidates found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          </div>
        </Card>
        {!fetchLoading && (
          <Pagination
            totalPages={!isFiltered ? totalPages : 1}
            currentPage={currentPage}
            handlePageChange={(page) => setCurrentPage(page)}
            className="m-4"
          />
        )}
      </div>

      {/* user profile drawer */}

      <>
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
      </>


      <>
      <AddNewUserModel
        isOpen={openModel}
        closeModal={() => setOpenModel(false)}
      />
      </>

      {/* Edit User Form Modal */}

      {/* <EditUserModel
        isOpen={editUserModalOpen}
        closeModal={closeEditModal}
        resourceId={selectedResourceId}
        fetchUsers={fetchUsers}
        currentUserRole={authData.role}
        currentPage={currentPage}
        // setStatusTab={setStatusTab}
      /> */}
    </>
  );
}

export default Users;
