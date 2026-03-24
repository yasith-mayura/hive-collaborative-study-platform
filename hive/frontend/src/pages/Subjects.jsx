import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import {
  createSubject,
  deleteSubject,
  getAllSubjects,
  updateSubject,
} from "@/services/resourceService";

const initialFormState = {
  subjectCode: "",
  subjectName: "",
  level: 1,
  semester: 1,
  description: "",
};

const getErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;

  if (status === 401) return "Session expired. Please login again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Requested subject was not found.";
  if (status === 500) return "Server error. Please try again.";

  return error?.response?.data?.message || fallbackMessage;
};

export default function Subjects() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const canManageSubjects = role === "superadmin";
  const canViewStats = role === "admin" || role === "superadmin";

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await getAllSubjects();
      setSubjects(response?.subjects || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load subjects"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        subject.subjectName?.toLowerCase().includes(query) ||
        subject.subjectCode?.toLowerCase().includes(query) ||
        subject.description?.toLowerCase().includes(query);

      const matchesLevel = levelFilter === "all" || Number(subject.level) === Number(levelFilter);
      const matchesSemester =
        semesterFilter === "all" || Number(subject.semester) === Number(semesterFilter);

      return matchesSearch && matchesLevel && matchesSemester;
    });
  }, [subjects, searchQuery, levelFilter, semesterFilter]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "level" || name === "semester" ? Number(value) : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedSubject(null);
  };

  const handleCreateSubject = async (event) => {
    event.preventDefault();

    try {
      setActionLoading(true);
      await createSubject({
        ...formData,
        subjectCode: formData.subjectCode.trim().toUpperCase(),
      });
      toast.success("Subject created successfully");
      setShowCreateModal(false);
      resetForm();
      loadSubjects();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create subject"));
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      level: subject.level,
      semester: subject.semester,
      description: subject.description || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubject = async (event) => {
    event.preventDefault();
    if (!selectedSubject?.subjectCode) return;

    try {
      setActionLoading(true);
      await updateSubject(selectedSubject.subjectCode, {
        subjectName: formData.subjectName,
        level: Number(formData.level),
        semester: Number(formData.semester),
        description: formData.description,
      });
      toast.success("Subject updated successfully");
      setShowEditModal(false);
      resetForm();
      loadSubjects();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update subject"));
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (subject) => {
    setSelectedSubject(subject);
    setShowDeleteModal(true);
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject?.subjectCode) return;

    try {
      setActionLoading(true);
      await deleteSubject(selectedSubject.subjectCode);
      setSubjects((prev) => prev.filter((item) => item.subjectCode !== selectedSubject.subjectCode));
      toast.success("Subject deleted successfully");
      setShowDeleteModal(false);
      setSelectedSubject(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete subject"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Resources</h1>
        <div className="flex items-center gap-3">
          {canViewStats && (
            <button
              onClick={() => navigate("/resources/stats")}
              className="bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition shadow-sm border border-gray-300 text-sm font-medium"
            >
              View Stats
            </button>
          )}
          {canManageSubjects && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition shadow-sm text-sm font-medium"
            >
              + Add Subject
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, code or description"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Filter by Level</label>
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
          >
            <option value="all">All Levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Filter by Semester</label>
          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No subjects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.subjectCode}
              className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div
                className="p-5 cursor-pointer"
                onClick={() => navigate(`/resources/subjects/${subject.subjectCode}`)}
              >
                <p className="text-xs text-gray-500 mb-1">{subject.subjectCode}</p>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{subject.subjectName}</h2>
                <div className="text-sm text-gray-600 mb-3">
                  Level {subject.level} | Semester {subject.semester}
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {subject.description || "No description available."}
                </p>
              </div>

              {canManageSubjects && (
                <div className="px-5 pb-5 flex items-center gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openEditModal(subject)}
                    className="bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(subject)}
                    className="bg-danger-500 text-white px-3 py-2 text-sm font-medium hover:opacity-90 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        title="Create New Subject"
        activeModal={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject Code</label>
              <input
                type="text"
                name="subjectCode"
                required
                value={formData.subjectCode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                placeholder="e.g. SE3050"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject Name</label>
              <input
                type="text"
                name="subjectName"
                required
                value={formData.subjectName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                placeholder="e.g. Software Architecture"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="Optional subject description"
            />
          </div>

          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="mr-3 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="bg-primary-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 rounded-md disabled:opacity-50"
            >
              {actionLoading ? "Creating..." : "Create Subject"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Edit Subject"
        activeModal={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
      >
        <form onSubmit={handleEditSubject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject Code</label>
            <input
              type="text"
              value={formData.subjectCode}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2 border bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject Name</label>
            <input
              type="text"
              name="subjectName"
              required
              value={formData.subjectName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              className="mr-3 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="bg-primary-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 rounded-md disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Delete Subject"
        activeModal={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSubject(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{selectedSubject?.subjectName}</span>?
          </p>
          <p className="text-sm text-gray-500">
            This will also hide all resources under this subject.
          </p>
          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedSubject(null);
              }}
              className="mr-3 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteSubject}
              className="bg-danger-500 text-white px-4 py-2 text-sm font-medium hover:opacity-90 rounded-md disabled:opacity-50"
            >
              {actionLoading ? "Deleting..." : "Delete Subject"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
