import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Drawer from "@/components/ui/Drawer";
import Notification from "@/components/ui/Notification";
import AdminProfile from "@/pages/superadmin/components/AdminProfile";
import AdminSearch from "@/pages/superadmin/components/AdminSearch";
import { getAllAdmins, deleteAdmin, demoteAdminToUser, updateAdmin } from "@/services";
import PromoteUserToAdmin from "./components/PromoteUserToAdmin";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

const BUTTON_COLORS = {
  primary: { backgroundColor: "#DDF2FF", color: "#0A435B", border: "1px solid #00BFD8" },
  success: { backgroundColor: "#DDF5E6", color: "#1B5133", border: "1px solid #3FB07A" },
  warning: { backgroundColor: "#FBEAB4", color: "#4A3A00", border: "1px solid #D9A900" },
  danger: { backgroundColor: "#F9DEE8", color: "#6F2F47", border: "1px solid #E07C9C" },
};

function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [openPromoteModal, setOpenPromoteModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const columns = [
    { label: "Name", field: "name" },
    { label: "Email", field: "email" },
    { label: "Role", field: "role" },
    { label: "Student Number", field: "studentNumber" },
    { label: "Actions", field: "actions" },
  ];

  const fetchAdmins = async () => {
    setFetchLoading(true);
    try {
      const response = await getAllAdmins();
      setAdmins(response || []);
      setFilteredAdmins(response || []);
    } catch (error) {
      Notification.error(error.message || "Failed to fetch admins");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSearch = () => {
    if (!searchQuery) {
      setFilteredAdmins(admins);
      return;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = admins.filter(
      (admin) =>
        admin.studentNumber?.toLowerCase().includes(lowercasedQuery) ||
        admin.name?.toLowerCase().includes(lowercasedQuery) ||
        admin.email?.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredAdmins(filtered);
  };

  const handleClick = (admin) => {
    setSelectedAdmin(admin);
    setOpenDrawer(true);
  };

  const handleDrawerClose = () => {
    setOpenDrawer(false);
    setSelectedAdmin(null);
  };

  const handleDeleteAdmin = async (studentNumber) => {
    setAdminToDelete(studentNumber);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setDeleteLoading(true);
    try {
      const result = await deleteAdmin(adminToDelete);
      Notification.success("Admin deactivated successfully");
      if (result?.warning) {
        Notification.warning(result.warning);
      }
      handleDrawerClose();
      fetchAdmins();
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to delete admin");
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
    }
  };

  const handleUpdateAdmin = async (currentStudentNumber, payload) => {
    try {
      const result = await updateAdmin(currentStudentNumber, payload);
      Notification.success("Admin updated successfully");
      if (result?.warning) {
        Notification.warning(result.warning);
      }
      handleDrawerClose();
      fetchAdmins();
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to update admin");
    }
  };

  const handleDemoteAdmin = async (studentNumber) => {
    try {
      const result = await demoteAdminToUser(studentNumber);
      Notification.success("Admin demoted to user successfully");
      if (result?.warning) {
        Notification.warning(result.warning);
      }
      handleDrawerClose();
      fetchAdmins();
    } catch (error) {
      Notification.error(error?.response?.data?.message || "Failed to demote admin");
    }
  };

  return (
    <>
      <div className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-full max-w-sm">
            <AdminSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
            />
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-sm py-2 px-4 shadow-theme-xs transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
            style={BUTTON_COLORS.success}
            onClick={() => setOpenPromoteModal(true)}
          >
            <Icon icon="heroicons-outline:arrow-up" className="w-5 h-5" />
            Promote to Admin
          </button>
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
                        {filteredAdmins.length > 0 ? (
                          filteredAdmins.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td
                                className="table-td cursor-pointer font-medium text-gray-900"
                                onClick={() => handleClick(row)}
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
                                    onClick={() => handleClick(row)}
                                    className="px-3 py-1 text-xs font-medium rounded transition-opacity hover:opacity-90"
                                    style={BUTTON_COLORS.primary}
                                  >
                                    Update
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDemoteAdmin(row.studentNumber)}
                                    className="px-3 py-1 text-xs font-medium rounded transition-opacity hover:opacity-90"
                                    style={BUTTON_COLORS.warning}
                                  >
                                    Demote
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAdmin(row.studentNumber)}
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
                              No admins found.
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
        {selectedAdmin && (
          <AdminProfile
            admin={selectedAdmin}
            onClose={handleDrawerClose}
            onDelete={handleDeleteAdmin}
            onDemote={handleDemoteAdmin}
            onUpdate={handleUpdateAdmin}
          />
        )}
      </Drawer>

      <PromoteUserToAdmin
        isOpen={openPromoteModal}
        closeModal={() => setOpenPromoteModal(false)}
        onUserPromoted={fetchAdmins}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAdmin}
        isLoading={deleteLoading}
        title="Deactivate Admin"
        message="Are you sure you want to deactivate this administrator? They will lose all management privileges."
      />
    </>
  );
}

export default AdminManagement;