import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from "@/services";

const TRACKS = ["Net", "Mobile", "Data", "Health", "Gaming", "Business"];

const initialForm = {
  subjectCode: "",
  subjectName: "",
  level: "",
  semester: "",
  status: "compulsory",
  specialisationTrack: "",
};

const extractCreditsFromCode = (courseCode = "") => {
  const compact = String(courseCode).replace(/\s+/g, "").toUpperCase();
  const parsed = Number.parseInt(compact.slice(-1), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return 0;
  return parsed;
};

const normalizeCode = (courseCode = "") => String(courseCode).trim().toUpperCase();

const getErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;

  if (status === 401) return "Session expired. Please login again.";
  if (status === 403) return "You do not have permission.";
  if (status === 404) return "Requested course was not found.";
  if (status === 409) return error?.response?.data?.message || "Course already exists.";
  if (status === 500) return "Server error. Please try again.";

  return error?.response?.data?.message || fallbackMessage;
};

export default function CourseManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState(initialForm);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await getCourses();
      setCourses(response?.courses || []);
    } catch (error) {
      Notification.error(getErrorMessage(error, "Failed to load courses."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesQuery =
        !query ||
        course.subjectCode?.toLowerCase().includes(query) ||
        course.subjectName?.toLowerCase().includes(query);
      const matchesYear = yearFilter === "all" || Number(course.level) === Number(yearFilter);
      const matchesSemester =
        semesterFilter === "all" || Number(course.semester) === Number(semesterFilter);
      const matchesStatus = statusFilter === "all" || course.status === statusFilter;
      return matchesQuery && matchesYear && matchesSemester && matchesStatus;
    });
  }, [courses, searchQuery, yearFilter, semesterFilter, statusFilter]);

  const groupedCourses = useMemo(() => {
    const grouped = new Map();

    filteredCourses.forEach((course) => {
      const key = `Y${course.level}S${course.semester}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          year: course.level,
          semester: course.semester,
          courses: [],
        });
      }
      grouped.get(key).courses.push(course);
    });

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.semester - b.semester;
    });
  }, [filteredCourses]);

  const resetForm = () => {
    setFormData(initialForm);
    setSelectedCourse(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      subjectCode: course.subjectCode,
      subjectName: course.subjectName,
      level: course.level,
      semester: course.semester,
      status: course.status,
      specialisationTrack: course.specialisationTrack || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (course) => {
    setSelectedCourse(course);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    resetForm();
  };

  const upsertCourse = async (isEdit) => {
    const payload = {
      subjectCode: normalizeCode(formData.subjectCode),
      subjectName: formData.subjectName.trim(),
      level: Number(formData.level),
      semester: Number(formData.semester),
      creditHours: extractCreditsFromCode(formData.subjectCode),
      status: formData.status,
      specialisationTrack:
        formData.status === "specialisation" ? formData.specialisationTrack || null : null,
    };

    if (!payload.subjectCode || !payload.subjectName || !payload.level || !payload.semester) {
      Notification.error("All required fields must be filled.");
      return;
    }

    if (payload.status === "specialisation" && !payload.specialisationTrack) {
      Notification.error("Please select a specialisation track.");
      return;
    }

    try {
      setSaving(true);
      if (isEdit && selectedCourse?.subjectCode) {
        await updateCourse(selectedCourse.subjectCode, payload);
        Notification.success("Course updated successfully");
      } else {
        await createCourse(payload);
        Notification.success("Course created successfully");
      }
      closeModals();
      loadCourses();
    } catch (error) {
      Notification.error(getErrorMessage(error, "Failed to save course."));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteCourse = async () => {
    if (!selectedCourse?.subjectCode) return;

    try {
      setSaving(true);
      await deleteCourse(selectedCourse.subjectCode);
      Notification.success("Course deleted successfully");
      closeModals();
      loadCourses();
    } catch (error) {
      Notification.error(getErrorMessage(error, "Failed to delete course."));
    } finally {
      setSaving(false);
    }
  };

  const renderForm = (isEdit) => {
    const extractedCredits = extractCreditsFromCode(formData.subjectCode);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="fromGroup">
            <label className="form-label">Course Code</label>
            <input
              type="text"
              className="form-control"
              value={formData.subjectCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, subjectCode: e.target.value }))}
              readOnly={isEdit}
            />
            <p className="text-xs text-secondary-500 mt-1">
              Credits: {extractedCredits || 0} (extracted from course code)
            </p>
          </div>
          <div className="fromGroup">
            <label className="form-label">Course Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.subjectName}
              onChange={(e) => setFormData((prev) => ({ ...prev, subjectName: e.target.value }))}
            />
          </div>
          <div className="fromGroup">
            <label className="form-label">Level</label>
            <select
              className="form-control"
              value={formData.level}
              onChange={(e) => setFormData((prev) => ({ ...prev, level: Number(e.target.value) }))}
            >
              <option value="">Select Level</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
          <div className="fromGroup">
            <label className="form-label">Semester</label>
            <select
              className="form-control"
              value={formData.semester}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, semester: Number(e.target.value) }))
              }
            >
              <option value="">Select Semester</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>
          <div className="fromGroup">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="compulsory">Compulsory</option>
              <option value="optional">Optional</option>
              <option value="specialisation">Specialisation</option>
            </select>
          </div>
          {formData.status === "specialisation" && (
            <div className="fromGroup">
              <label className="form-label">Specialisation Track</label>
              <select
                className="form-control"
                value={formData.specialisationTrack}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, specialisationTrack: e.target.value }))
                }
              >
                <option value="">Select Track</option>
                {TRACKS.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="fromGroup">
            <label className="form-label">Credit Hours</label>
            <input type="number" className="form-control" value={extractedCredits} readOnly />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-secondary-800">Course Management</h1>
        <Button text="Add New Course" className="btn-primary btn-sm" onClick={openAddModal} />
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm text-primary-900">
        Courses added here are used across Progress Tracking and Resource Management.
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by course code or name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="form-control"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="all">All Levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
          <option value="4">Level 4</option>
        </select>
        <select
          className="form-control"
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
        >
          <option value="all">All Semesters</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
        </select>
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="compulsory">Compulsory</option>
          <option value="optional">Optional</option>
          <option value="specialisation">Specialisation</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : groupedCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 shadow-sm text-center text-secondary-500">
          No courses found.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedCourses.map((group) => (
            <div key={`Y${group.year}S${group.semester}`} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-secondary-800 mb-3">
                Level {group.year} - Semester {group.semester}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 table-fixed">
                  <thead>
                    <tr>
                      <th className="table-th">Course Code</th>
                      <th className="table-th">Course Name</th>
                      <th className="table-th">Credits</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Specialisation Track</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {group.courses.map((course) => (
                      <tr key={course.subjectCode}>
                        <td className="table-td">{course.subjectCode}</td>
                        <td className="table-td">{course.subjectName}</td>
                        <td className="table-td">{course.creditHours}</td>
                        <td className="table-td capitalize">{course.status}</td>
                        <td className="table-td">{course.specialisationTrack || "-"}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEditModal(course)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => openDeleteModal(course)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        activeModal={isAddModalOpen}
        onClose={closeModals}
        title="Add New Course"
        centered
        footerContent={
          <>
            <Button text="Cancel" className="btn-outline-secondary" onClick={closeModals} />
            <Button
              text="Save Course"
              className="btn-primary"
              onClick={() => upsertCourse(false)}
              isLoading={saving}
              disabled={saving}
            />
          </>
        }
      >
        {renderForm(false)}
      </Modal>

      <Modal
        activeModal={isEditModalOpen}
        onClose={closeModals}
        title="Edit Course"
        centered
        footerContent={
          <>
            <Button text="Cancel" className="btn-outline-secondary" onClick={closeModals} />
            <Button
              text="Save Changes"
              className="btn-primary"
              onClick={() => upsertCourse(true)}
              isLoading={saving}
              disabled={saving}
            />
          </>
        }
      >
        {renderForm(true)}
      </Modal>

      <Modal
        activeModal={isDeleteModalOpen}
        onClose={closeModals}
        title="Delete Course"
        centered
        footerContent={
          <>
            <Button text="Cancel" className="btn-outline-secondary" onClick={closeModals} />
            <Button
              text="Delete Course"
              className="btn-danger"
              onClick={onDeleteCourse}
              isLoading={saving}
              disabled={saving}
            />
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-secondary-700">
            Are you sure you want to delete {selectedCourse?.subjectName || "this course"}?
          </p>
          <p className="text-sm text-warning-700">
            This will hide the course from students when adding results. Existing results will not
            be affected.
          </p>
        </div>
      </Modal>
    </div>
  );
}
