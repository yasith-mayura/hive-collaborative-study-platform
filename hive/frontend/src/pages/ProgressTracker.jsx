import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Notification from "@/components/ui/Notification";
import { useAuth } from "@/context/AuthContext";
import {
  addSemester,
  deleteSemester,
  getCourses,
  getProgress,
  getProgressByUserId,
  getProgressSummary,
  updateSemester,
} from "@/services";
import {
  generateGPASuggestions,
  formatScenarioDescription,
  getEffortLabel,
} from "@/lib/gpaSuggestions";

const GRADE_MAP = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  E: 0.0,
};

const GRADE_OPTIONS = Object.keys(GRADE_MAP);

const emptySemesterForm = {
  yearLevel: "",
  semester: "",
  selectedCourseCodes: [],
  courseGrades: {},
};

const round2 = (value) => Number((value || 0).toFixed(2));
const toStoredYear = (yearLevel) => `Y${Number(yearLevel)}`;

const getErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;

  if (status === 401) return "Session expired. Please login again.";
  if (status === 403) return "You do not have permission.";
  if (status === 404) return "No progress data found.";
  if (status === 500) return "Server error. Please try again.";

  return error?.response?.data?.message || fallbackMessage;
};

const getGradeColorClass = (grade = "") => {
  if (grade.startsWith("A")) return "text-success-500";
  if (grade.startsWith("B")) return "text-info-700";
  if (grade.startsWith("C")) return "text-warning-600";
  if (grade === "D" || grade === "D+") return "text-warning-700";
  return "text-danger-500";
};

const getGpaColorClass = (gpa) => {
  if (gpa >= 3.5) return "text-success-500";
  if (gpa >= 2.5) return "text-warning-600";
  return "text-danger-500";
};

const calculatePreview = (modules = []) => {
  const normalized = modules
    .map((module) => ({
      ...module,
      creditHours: Number(module.creditHours),
      gradePoints: GRADE_MAP[module.grade],
    }))
    .filter(
      (module) =>
        module.moduleCode.trim() &&
        module.moduleName.trim() &&
        module.creditHours > 0 &&
        typeof module.gradePoints === "number"
    );

  const totalCredits = normalized.reduce((sum, module) => sum + module.creditHours, 0);
  const totalWeighted = normalized.reduce(
    (sum, module) => sum + module.gradePoints * module.creditHours,
    0
  );

  return {
    totalCredits,
    semesterGPA: totalCredits > 0 ? round2(totalWeighted / totalCredits) : 0,
  };
};

const parseYearStart = (year) => {
  const yearLevelMatch = String(year || "").trim().match(/^Y([1-4])$/i);
  if (yearLevelMatch) return Number(yearLevelMatch[1]);

  const parsed = Number((year || "").split("/")[0]);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const displayYear = (year) => {
  const yearLevelMatch = String(year || "").trim().match(/^Y([1-4])$/i);
  if (yearLevelMatch) return `Year ${yearLevelMatch[1]}`;
  return year;
};

const sortSemesters = (semesters = []) => {
  return [...semesters].sort((a, b) => {
    const byYear = parseYearStart(a.year) - parseYearStart(b.year);
    if (byYear !== 0) return byYear;
    return Number(a.semester) - Number(b.semester);
  });
};

const getNextSemesterTarget = (semesters = []) => {
  const sorted = sortSemesters(semesters);

  if (!sorted.length) {
    return { yearLevel: 1, semester: 1 };
  }

  const lastSemester = sorted[sorted.length - 1];
  const lastYearLevel = parseYearStart(lastSemester.year) || 1;
  const lastSemesterNo = Number(lastSemester.semester) || 1;

  if (lastSemesterNo === 1) {
    return { yearLevel: lastYearLevel, semester: 2 };
  }

  if (lastYearLevel >= 4) {
    return null;
  }

  return { yearLevel: lastYearLevel + 1, semester: 1 };
};

const withDefaultProgress = (data) => ({
  userId: data?.userId || "",
  studentNumber: data?.studentNumber || "",
  semesters: sortSemesters(data?.semesters || []),
  cumulativeGPA: data?.cumulativeGPA || 0,
});

const formatTrend = (semesters = []) => {
  const sorted = sortSemesters(semesters);
  const baseYear = sorted.length > 0 ? parseYearStart(sorted[0].year) : 0;

  let runningWeightedPoints = 0;
  let runningCredits = 0;

  return sorted.map((semester) => {
    const modules = semester.modules || [];
    const semesterCredits = Number(semester.totalCredits || 0);
    const moduleWeightedPoints = modules.reduce(
      (sum, module) => sum + Number(module.gradePoints || 0) * Number(module.creditHours || 0),
      0
    );
    const semesterWeightedPoints = moduleWeightedPoints || Number(semester.semesterGPA || 0) * semesterCredits;

    runningWeightedPoints += semesterWeightedPoints;
    runningCredits += semesterCredits;

    return {
      ...semester,
      label: `Y${Math.max(parseYearStart(semester.year) - baseYear + 1, 1)}S${semester.semester}`,
      gpa: runningCredits > 0 ? round2(runningWeightedPoints / runningCredits) : 0,
      credits: semester.totalCredits,
    };
  });
};

function SemesterModal({
  isOpen,
  title,
  form,
  setForm,
  availableCourses,
  isCoursesLoading,
  onClose,
  onSubmit,
  isSaving,
}) {
  const compulsoryCourses = useMemo(
    () => availableCourses.filter((course) => course.status === "compulsory"),
    [availableCourses]
  );
  const optionalCourses = useMemo(
    () => availableCourses.filter((course) => course.status === "optional"),
    [availableCourses]
  );
  const specialisationCourses = useMemo(
    () => availableCourses.filter((course) => course.status === "specialisation"),
    [availableCourses]
  );

  const selectedCodes = form.selectedCourseCodes || [];
  const grades = form.courseGrades || {};

  const selectedCourses = useMemo(() => {
    const selectedSet = new Set(selectedCodes);
    return availableCourses.filter((course) => selectedSet.has(course.subjectCode));
  }, [availableCourses, selectedCodes]);

  const preview = useMemo(
    () =>
      calculatePreview(
        selectedCourses.map((course) => ({
          moduleCode: course.subjectCode,
          moduleName: course.subjectName,
          creditHours: course.creditHours,
          grade: grades[course.subjectCode] || "",
        }))
      ),
    [selectedCourses, grades]
  );

  const specialisationByTrack = useMemo(() => {
    return specialisationCourses.reduce((acc, course) => {
      const key = course.specialisationTrack || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(course);
      return acc;
    }, {});
  }, [specialisationCourses]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCourseSelection = (courseCode) => {
    setForm((prev) => {
      const exists = prev.selectedCourseCodes.includes(courseCode);
      const selectedCourseCodes = exists
        ? prev.selectedCourseCodes.filter((code) => code !== courseCode)
        : [...prev.selectedCourseCodes, courseCode];

      const nextGrades = { ...prev.courseGrades };
      if (exists) delete nextGrades[courseCode];

      return {
        ...prev,
        selectedCourseCodes,
        courseGrades: nextGrades,
      };
    });
  };

  const updateCourseGrade = (courseCode, grade) => {
    setForm((prev) => ({
      ...prev,
      courseGrades: {
        ...prev.courseGrades,
        [courseCode]: grade,
      },
    }));
  };

  const renderCourseRow = (course, forceSelected = false) => {
    const hasGrade = Boolean(grades[course.subjectCode]);
    const isSelected = forceSelected || selectedCodes.includes(course.subjectCode) || hasGrade;

    const handleGradeChange = (value) => {
      if (!forceSelected) {
        if (value && !selectedCodes.includes(course.subjectCode)) {
          toggleCourseSelection(course.subjectCode);
        }

        if (!value && selectedCodes.includes(course.subjectCode)) {
          toggleCourseSelection(course.subjectCode);
          return;
        }
      }

      updateCourseGrade(course.subjectCode, value);
    };

    return (
      <div
        key={course.subjectCode}
        className="grid grid-cols-12 gap-2 items-center py-2 border-b border-slate-100 last:border-b-0"
      >
        <div className="col-span-1">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={isSelected}
            disabled={forceSelected}
            onChange={() => toggleCourseSelection(course.subjectCode)}
          />
        </div>
        <div className="col-span-5 text-sm text-secondary-800">
          <p className="font-medium">{course.subjectCode}</p>
          <p className="text-xs text-secondary-500">{course.subjectName}</p>
        </div>
        <div className="col-span-2 text-sm text-secondary-700">{course.creditHours} Credits</div>
        <div className="col-span-4">
          <select
            className="form-control"
            value={grades[course.subjectCode] || ""}
            onChange={(e) => handleGradeChange(e.target.value)}
          >
            <option value="">Select Grade</option>
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const footerContent = (
    <>
      <Button text="Cancel" className="btn-outline-secondary" onClick={onClose} />
      <button
        type="button"
        className="btn inline-flex justify-center"
        onClick={onSubmit}
        disabled={isSaving}
        style={{ backgroundColor: "#FFF4CC", color: "#4D3D00" }}
      >
        {isSaving ? "Saving..." : "Save Results"}
      </button>
    </>
  );

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title={title}
      className="max-w-5xl"
      footerContent={footerContent}
      scrollContent
      centered
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="fromGroup">
            <label className="form-label">Year</label>
            <select
              className="form-control"
              value={form.yearLevel}
              onChange={(e) => setField("yearLevel", Number(e.target.value))}
            >
              <option value="">Select Year</option>
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
            </select>
          </div>
          <div className="fromGroup">
            <label className="form-label">Semester</label>
            <select
              className="form-control"
              value={form.semester}
              onChange={(e) => setField("semester", Number(e.target.value))}
            >
              <option value="">Select Semester</option>
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {isCoursesLoading ? (
            <div className="flex justify-center items-center h-24 border border-slate-200 rounded-md">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {compulsoryCourses.length > 0 && (
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                  <h3 className="text-sm font-semibold text-secondary-800 mb-2">Compulsory Courses</h3>
                  {compulsoryCourses.map((course) => renderCourseRow(course, true))}
                </div>
              )}

              {optionalCourses.length > 0 && (
                <div className="border border-slate-200 rounded-md p-3">
                  <h3 className="text-sm font-semibold text-secondary-800 mb-2">Optional Courses</h3>
                  {optionalCourses.map((course) => renderCourseRow(course))}
                </div>
              )}

              {Object.keys(specialisationByTrack).length > 0 && (
                <div className="border border-slate-200 rounded-md p-3">
                  <h3 className="text-sm font-semibold text-secondary-800 mb-2">Specialisation Courses</h3>
                  {Object.entries(specialisationByTrack).map(([track, courses]) => (
                    <div key={track} className="mb-3 last:mb-0">
                      <p className="text-xs font-medium uppercase text-secondary-500 mb-1">{track}</p>
                      {courses.map((course) => renderCourseRow(course))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {selectedCourses.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <p className="text-sm text-secondary-700 font-medium">
              Semester GPA: <span className="text-secondary-900">{preview.semesterGPA.toFixed(2)}</span>
            </p>
            <p className="text-sm text-secondary-700 font-medium mt-1">
              Total Credits: <span className="text-secondary-900">{preview.totalCredits}</span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const point = payload[0]?.payload;
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100">
        <p className="text-xs text-secondary-500">{label}</p>
        <p className="text-sm font-semibold text-secondary-800">
          GPA: {payload[0].value.toFixed(2)}
        </p>
        <p className="text-xs text-secondary-500">Credits: {point?.credits || 0}</p>
      </div>
    );
  }
  return null;
};

export default function ProgressTracker() {
  const { role, viewMode, user } = useAuth();
  const isPrivilegedRole = role === "superadmin";
  const isAdminUser = isPrivilegedRole && viewMode !== "student";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState("");

  const [summaryList, setSummaryList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [progress, setProgress] = useState(withDefaultProgress());
  const [summary, setSummary] = useState({
    currentGPA: 0,
    highestSemesterGPA: 0,
    lowestSemesterGPA: 0,
    totalCreditsCompleted: 0,
    totalSemestersRecorded: 0,
  });

  const [expandedIds, setExpandedIds] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSemesterId, setEditSemesterId] = useState("");
  const [semesterForm, setSemesterForm] = useState(emptySemesterForm);
  const [availableCourses, setAvailableCourses] = useState([]);

  const [targetGPA, setTargetGPA] = useState("");
  const [gpaAdvice, setGpaAdvice] = useState("");
  const [gpaSuggestions, setGpaSuggestions] = useState(null);
  const [expandedScenario, setExpandedScenario] = useState(0);
  const [nextSemesterPlan, setNextSemesterPlan] = useState({
    yearLevel: null,
    semester: null,
    courses: [],
    totalCredits: 0,
    loading: false,
    error: "",
  });

  const canEdit = !isAdminUser;

  const loadStudentProgress = async (userId) => {
    try {
      setLoading(true);
      setError("");

      const [progressResponse, summaryResponse] = await Promise.all([
        userId ? getProgressByUserId(userId) : getProgress(),
        getProgressSummary(userId),
      ]);

      const normalized = withDefaultProgress(progressResponse);
      setProgress(normalized);
      setSummary(summaryResponse || {});
      setExpandedIds(
        Object.fromEntries((normalized.semesters || []).map((semester) => [semester._id, false]))
      );
    } catch (requestError) {
      if (requestError?.response?.status === 404) {
        setProgress(withDefaultProgress());
        setSummary({
          currentGPA: 0,
          highestSemesterGPA: 0,
          lowestSemesterGPA: 0,
          totalCreditsCompleted: 0,
          totalSemestersRecorded: 0,
        });
      } else {
        setError(getErrorMessage(requestError, "Failed to load progress data."));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAdminSummary = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getProgress();
      setSummaryList(response || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Failed to load progress summary."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminUser) {
      loadAdminSummary();
      return;
    }
    const isAdminLikeRole = role === "admin" || role === "superadmin";
    const ownUserId = isAdminLikeRole ? user?.uid : undefined;
    loadStudentProgress(ownUserId);
  }, [isAdminUser, isPrivilegedRole, user?.uid]);

  useEffect(() => {
    const loadCoursesForSelection = async () => {
      if (!(isAddModalOpen || isEditModalOpen)) return;
      if (![1, 2, 3, 4].includes(Number(semesterForm.yearLevel))) {
        setAvailableCourses([]);
        return;
      }
      if (![1, 2].includes(Number(semesterForm.semester))) {
        setAvailableCourses([]);
        return;
      }

      try {
        setLoadingCourses(true);
        const response = await getCourses({
          year: semesterForm.yearLevel,
          semester: semesterForm.semester,
        });

        const courses = response?.courses || [];
        const compulsoryCodes = courses
          .filter((course) => course.status === "compulsory")
          .map((course) => course.subjectCode);

        setAvailableCourses(courses);
        setSemesterForm((prev) => ({
          ...prev,
          selectedCourseCodes: Array.from(
            new Set([...compulsoryCodes, ...(prev.selectedCourseCodes || [])])
          ).filter((code) => courses.some((course) => course.subjectCode === code)),
        }));
      } catch (requestError) {
        Notification.error(getErrorMessage(requestError, "Failed to load courses."));
        setAvailableCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCoursesForSelection();
  }, [isAddModalOpen, isEditModalOpen, semesterForm.yearLevel, semesterForm.semester]);

  useEffect(() => {
    const loadNextSemesterCourses = async () => {
      if (isAdminUser) return;

      const target = getNextSemesterTarget(progress.semesters);

      if (!target) {
        setNextSemesterPlan({
          yearLevel: null,
          semester: null,
          courses: [],
          totalCredits: 0,
          loading: false,
          error: "All semesters appear to be completed.",
        });
        return;
      }

      try {
        setNextSemesterPlan((prev) => ({
          ...prev,
          yearLevel: target.yearLevel,
          semester: target.semester,
          loading: true,
          error: "",
        }));

        const response = await getCourses({
          year: target.yearLevel,
          semester: target.semester,
        });

        const allCourses = response?.courses || [];
        const compulsoryCourses = allCourses.filter((course) => course.status === "compulsory");
        const selectedCourses = compulsoryCourses.length > 0 ? compulsoryCourses : allCourses;
        const totalCredits = selectedCourses.reduce(
          (sum, course) => sum + Number(course.creditHours || 0),
          0
        );

        setNextSemesterPlan({
          yearLevel: target.yearLevel,
          semester: target.semester,
          courses: selectedCourses,
          totalCredits,
          loading: false,
          error: selectedCourses.length === 0 ? "No courses found for the next semester." : "",
        });
      } catch (requestError) {
        setNextSemesterPlan({
          yearLevel: target.yearLevel,
          semester: target.semester,
          courses: [],
          totalCredits: 0,
          loading: false,
          error: getErrorMessage(requestError, "Failed to load next semester courses."),
        });
      }
    };

    loadNextSemesterCourses();
  }, [isAdminUser, progress.semesters]);

  const trendData = useMemo(() => formatTrend(progress.semesters), [progress.semesters]);

  const filteredSummary = useMemo(() => {
    let result = summaryList;

    if (batchFilter) {
      result = result.filter((student) => String(student.level) === String(batchFilter));
    }

    if (searchQuery.trim()) {
      const needle = searchQuery.trim().toLowerCase();
      result = result.filter(
        (student) =>
          student.studentName?.toLowerCase().includes(needle) ||
          student.studentNumber?.toLowerCase().includes(needle)
      );
    }

    return result;
  }, [searchQuery, batchFilter, summaryList]);

  const batchOptions = useMemo(() => {
    return [...new Set(summaryList.map((s) => s.level).filter(Boolean))].sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      const bothNumeric = !Number.isNaN(numA) && !Number.isNaN(numB);

      if (bothNumeric) {
        return numB - numA;
      }

      return String(b).localeCompare(String(a));
    });
  }, [summaryList]);

  const validationError = useMemo(() => {
    if (![1, 2, 3, 4].includes(Number(semesterForm.yearLevel))) {
      return "Year must be between 1 and 4.";
    }
    if (![1, 2].includes(Number(semesterForm.semester))) {
      return "Semester must be either 1 or 2.";
    }

    const selectedCodes = semesterForm.selectedCourseCodes || [];
    if (!selectedCodes.length) {
      return "At least one course is required.";
    }

    const compulsoryCodes = availableCourses
      .filter((course) => course.status === "compulsory")
      .map((course) => course.subjectCode);

    for (const compulsoryCode of compulsoryCodes) {
      if (!selectedCodes.includes(compulsoryCode)) {
        return "All compulsory courses must remain selected.";
      }
    }

    for (const code of selectedCodes) {
      const selectedGrade = semesterForm.courseGrades?.[code];
      if (!Object.prototype.hasOwnProperty.call(GRADE_MAP, selectedGrade)) {
        return "All selected courses must have a grade.";
      }
    }

    const storedYear = toStoredYear(semesterForm.yearLevel);
    const duplicate = progress.semesters.some(
      (semester) =>
        semester.year === storedYear &&
        Number(semester.semester) === Number(semesterForm.semester) &&
        semester._id !== editSemesterId
    );

    if (duplicate) {
      return "Duplicate academic year and semester is not allowed.";
    }

    return "";
  }, [semesterForm, progress.semesters, editSemesterId, availableCourses]);

  const openAddModal = () => {
    setSemesterForm(emptySemesterForm);
    setAvailableCourses([]);
    setEditSemesterId("");
    setIsAddModalOpen(true);
  };

  const openEditModal = (semester) => {
    const yearLevelMatch = String(semester.year || "").match(/^Y([1-4])$/i);
    const inferredYearLevel = yearLevelMatch
      ? Number(yearLevelMatch[1])
      : Math.min(
        4,
        Math.max(
          1,
          sortSemesters(progress.semesters).findIndex((entry) => entry.year === semester.year) + 1
        )
      );

    setSemesterForm({
      yearLevel: inferredYearLevel,
      semester: semester.semester,
      selectedCourseCodes: (semester.modules || []).map((module) => module.moduleCode),
      courseGrades: Object.fromEntries(
        (semester.modules || []).map((module) => [module.moduleCode, module.grade])
      ),
    });
    setAvailableCourses([]);
    setEditSemesterId(semester._id);
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditSemesterId("");
    setSemesterForm(emptySemesterForm);
    setAvailableCourses([]);
  };

  const saveSemester = async () => {
    if (validationError) {
      Notification.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        year: toStoredYear(semesterForm.yearLevel),
        semester: Number(semesterForm.semester),
        modules: (semesterForm.selectedCourseCodes || []).map((courseCode) => {
          const matchedCourse = availableCourses.find((course) => course.subjectCode === courseCode);
          return {
            moduleCode: courseCode,
            moduleName: matchedCourse?.subjectName || courseCode,
            creditHours: Number(matchedCourse?.creditHours || 1),
            grade: semesterForm.courseGrades[courseCode],
          };
        }),
      };

      const response = isEditModalOpen
        ? await updateSemester(editSemesterId, payload)
        : await addSemester(payload);

      const updatedProgress = withDefaultProgress(response?.data);
      setProgress(updatedProgress);

      const semesterGpas = updatedProgress.semesters.map((semester) => semester.semesterGPA);
      const totalCreditsCompleted = updatedProgress.semesters.reduce(
        (sum, semester) => sum + (semester.totalCredits || 0),
        0
      );

      setSummary({
        currentGPA: updatedProgress.cumulativeGPA,
        highestSemesterGPA: semesterGpas.length ? Math.max(...semesterGpas) : 0,
        lowestSemesterGPA: semesterGpas.length ? Math.min(...semesterGpas) : 0,
        totalCreditsCompleted,
        totalSemestersRecorded: updatedProgress.semesters.length,
      });

      Notification.success(isEditModalOpen ? "Semester updated successfully" : "Semester added successfully");
      closeModals();
    } catch (requestError) {
      Notification.error(getErrorMessage(requestError, "Failed to save semester."));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteSemester = async (semesterId) => {
    const confirmed = window.confirm("Are you sure you want to delete this semester?");
    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await deleteSemester(semesterId);
      const updatedProgress = withDefaultProgress(response?.data);
      setProgress(updatedProgress);

      const semesterGpas = updatedProgress.semesters.map((semester) => semester.semesterGPA);
      const totalCreditsCompleted = updatedProgress.semesters.reduce(
        (sum, semester) => sum + (semester.totalCredits || 0),
        0
      );

      setSummary({
        currentGPA: updatedProgress.cumulativeGPA,
        highestSemesterGPA: semesterGpas.length ? Math.max(...semesterGpas) : 0,
        lowestSemesterGPA: semesterGpas.length ? Math.min(...semesterGpas) : 0,
        totalCreditsCompleted,
        totalSemestersRecorded: updatedProgress.semesters.length,
      });

      Notification.success("Semester deleted successfully");
    } catch (requestError) {
      Notification.error(getErrorMessage(requestError, "Failed to delete semester."));
    } finally {
      setSaving(false);
    }
  };

  const toggleExpanded = (semesterId) => {
    setExpandedIds((prev) => ({ ...prev, [semesterId]: !prev[semesterId] }));
  };

  const openAdminStudent = async (student) => {
    setSelectedStudent(student);
    await loadStudentProgress(student.userId);
  };

  const runGpaCalculator = () => {
    const currentGPA = Number(summary.currentGPA || 0);
    const currentCredits = Number(summary.totalCreditsCompleted || 0);
    const desired = Number(targetGPA);
    const nextCourses = nextSemesterPlan.courses || [];

    if (Number.isNaN(desired)) {
      setGpaAdvice("Please enter a valid target GPA.");
      setGpaSuggestions(null);
      return;
    }

    if (nextSemesterPlan.loading) {
      setGpaAdvice("Loading next semester courses. Please try again in a moment.");
      setGpaSuggestions(null);
      return;
    }

    if (nextSemesterPlan.error) {
      setGpaAdvice(nextSemesterPlan.error);
      setGpaSuggestions(null);
      return;
    }

    if (!nextCourses.length) {
      setGpaAdvice("No next semester courses available for GPA calculation.");
      setGpaSuggestions(null);
      return;
    }

    // Generate suggestions using the new utility
    const suggestions = generateGPASuggestions({
      currentGPA,
      currentCredits,
      targetGPA: desired,
      plannedCredits: nextSemesterPlan.totalCredits,
      nextSemesterCourses: nextCourses,
    });

    setGpaSuggestions(suggestions);
    setExpandedScenario(0); // Always expand first scenario by default

    if (!suggestions.isAchievable) {
      setGpaAdvice(suggestions.message);
      return;
    }

    const required = suggestions.requiredSemesterGPA;
    setGpaAdvice(
      `You need a semester GPA of ${required.toFixed(2)} in your next semester to reach your target GPA of ${desired}.`
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-md px-4 py-3">
        {error}
      </div>
    );
  }

  if (isAdminUser && !selectedStudent) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-secondary-800">Progress Tracker</h1>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <input
              type="text"
              className="form-control flex-1 py-2 h-10"
              placeholder="Search by student name or student number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {role === "superadmin" && (
              <select
                className="form-control md:w-48 py-2 h-10"
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
              >
                <option value="">All Batches</option>
                {batchOptions.map((batch) => (
                  <option key={batch} value={batch}>
                    Batch {batch}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 table-fixed">
              <thead>
                <tr>
                  <th className="table-th">Student Name</th>
                  <th className="table-th">Student Number</th>
                  <th className="table-th">Level</th>
                  <th className="table-th">Cumulative GPA</th>
                  <th className="table-th">Semesters Recorded</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredSummary.length > 0 ? (
                  filteredSummary.map((student) => (
                    <tr key={student.userId}>
                      <td className="table-td">{student.studentName}</td>
                      <td className="table-td">{student.studentNumber}</td>
                      <td className="table-td">{student.level || "-"}</td>
                      <td className={`table-td font-semibold ${getGpaColorClass(student.cumulativeGPA)}`}>
                        {(student.cumulativeGPA || 0).toFixed(2)}
                      </td>
                      <td className="table-td">{student.semestersRecorded || 0}</td>
                      <td className="table-td">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openAdminStudent(student)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="table-td text-center">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const currentGPA = Number(summary.currentGPA || progress.cumulativeGPA || 0);
  const highestSemester = Number(summary.highestSemesterGPA || 0);
  const creditsCompleted = Number(summary.totalCreditsCompleted || 0);
  const semesterCount = Number(summary.totalSemestersRecorded || progress.semesters.length || 0);

  const hasSemesters = progress.semesters.length > 0;

  const renderEmptyState = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-10 shadow-sm text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mb-3">
        <Icon icon="heroicons-outline:academic-cap" className="text-2xl" />
      </div>
      <h2 className="text-lg font-semibold text-secondary-800">No Results Added Yet</h2>
      <p className="text-sm text-secondary-500 mt-2">
        Start tracking your academic progress by adding your semester results.
      </p>
      {canEdit && (
        <Button text="Add First Semester" className="btn-primary mt-4" onClick={openAddModal} />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-secondary-800">Progress Tracker</h1>
          {selectedStudent && (
            <p className="text-sm text-secondary-500 mt-1">
              {selectedStudent.studentName} ({selectedStudent.studentNumber})
            </p>
          )}
        </div>
        {selectedStudent && (
          <Button
            text="Back to Students"
            className="btn-outline-secondary btn-sm"
            onClick={() => {
              setSelectedStudent(null);
              setProgress(withDefaultProgress());
              setSummary({
                currentGPA: 0,
                highestSemesterGPA: 0,
                lowestSemesterGPA: 0,
                totalCreditsCompleted: 0,
                totalSemestersRecorded: 0,
              });
              loadAdminSummary();
            }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-secondary-500">Cumulative GPA</p>
          <p className={`text-3xl font-bold mt-1 ${getGpaColorClass(currentGPA)}`}>
            {currentGPA.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-secondary-500">Best Semester</p>
          <p className="text-3xl font-bold mt-1 text-secondary-800">{highestSemester.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-secondary-500">Credits Completed</p>
          <p className="text-3xl font-bold mt-1 text-secondary-800">{creditsCompleted}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-secondary-500">Semesters</p>
          <p className="text-3xl font-bold mt-1 text-secondary-800">{semesterCount}</p>
        </div>
      </div>

      {hasSemesters ? (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-secondary-800">Cumulative GPA Trend</h2>
              {canEdit && (
                <div style={{ display: "inline-block" }}>
                  <button
                    type="button"
                    className="btn btn-sm inline-flex justify-center"
                    onClick={openAddModal}
                    style={{ backgroundColor: "#FFF4CC", color: "#4D3D00" }}
                  >
                    Add Semester
                  </button>
                </div>
              )}
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" stroke="#E5E7EB" vertical />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#D1D5DB" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 4]}
                  ticks={[0, 1, 2, 3, 4]}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#D1D5DB" }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={2.0} stroke="#FA916B" strokeDasharray="4 4" />
                <ReferenceLine y={3.5} stroke="#50C793" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke="#FFCC00"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#FFCC00", stroke: "#393E41", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#FFCC00", stroke: "#393E41", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {progress.semesters.map((semester) => {
              const semesterGPA = Number(semester.semesterGPA || 0);

              return (
                <div key={semester._id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-secondary-800">
                        {displayYear(semester.year)} - Semester {semester.semester}
                      </h3>
                      <p className="text-sm text-secondary-500 mt-1">Total Credits: {semester.totalCredits}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${semesterGPA >= 3.5 ? "bg-success-100 text-success-600" : "bg-slate-100 text-secondary-700"}`}>
                        Semester GPA {semesterGPA.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => toggleExpanded(semester._id)}
                      >
                        {expandedIds[semester._id] ? "Collapse" : "Expand"}
                      </button>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEditModal(semester)}
                            disabled={saving}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onDeleteSemester(semester._id)}
                            disabled={saving}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {expandedIds[semester._id] && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100 table-fixed">
                        <thead>
                          <tr>
                            <th className="table-th">Module Code</th>
                            <th className="table-th">Module Name</th>
                            <th className="table-th">Credits</th>
                            <th className="table-th">Grade</th>
                            <th className="table-th">Grade Points</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {(semester.modules || []).map((module, index) => (
                            <tr key={`${semester._id}-${index}`}>
                              <td className="table-td">{module.moduleCode}</td>
                              <td className="table-td">{module.moduleName}</td>
                              <td className="table-td">{module.creditHours}</td>
                              <td className={`table-td font-semibold ${getGradeColorClass(module.grade)}`}>
                                {module.grade}
                              </td>
                              <td className="table-td">{Number(module.gradePoints || 0).toFixed(1)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td className="table-td font-semibold">Totals</td>
                            <td className="table-td">-</td>
                            <td className="table-td font-semibold">{semester.totalCredits}</td>
                            <td className="table-td">-</td>
                            <td className="table-td font-semibold">Semester GPA {semesterGPA.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isAdminUser && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-secondary-800">GPA Calculator</h2>
              <p className="text-sm text-secondary-500 mt-1">
                Calculate what GPA you need to achieve your target.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="fromGroup">
                  <label className="form-label">Current cumulative GPA</label>
                  <input type="number" className="form-control" value={currentGPA.toFixed(2)} readOnly />
                </div>
                <div className="fromGroup">
                  <label className="form-label">Current total credits</label>
                  <input type="number" className="form-control" value={creditsCompleted} readOnly />
                </div>
                <div className="fromGroup">
                  <label className="form-label">Target cumulative GPA</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="eg 3.60"
                    value={targetGPA}
                    onChange={(e) => setTargetGPA(e.target.value)}
                  />
                </div>
                <div className="fromGroup">
                  <label className="form-label">Next semester</label>
                  <input
                    type="text"
                    className="form-control"
                    value={
                      nextSemesterPlan.yearLevel && nextSemesterPlan.semester
                        ? `Year ${nextSemesterPlan.yearLevel} Semester ${nextSemesterPlan.semester}`
                        : "Not available"
                    }
                    readOnly
                  />
                </div>
              </div>

              <div className="mt-3 text-sm text-secondary-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                {nextSemesterPlan.loading && <p>Loading next semester subjects and credits...</p>}
                {!nextSemesterPlan.loading && nextSemesterPlan.error && <p>{nextSemesterPlan.error}</p>}
                {!nextSemesterPlan.loading && !nextSemesterPlan.error && nextSemesterPlan.courses.length > 0 && (
                  <p>
                    Using {nextSemesterPlan.courses.length} subject{nextSemesterPlan.courses.length > 1 ? "s" : ""} ({nextSemesterPlan.totalCredits} total credits)
                    from Year {nextSemesterPlan.yearLevel} Semester {nextSemesterPlan.semester}.
                  </p>
                )}
              </div>

              <Button text="Calculate" className="btn-secondary mt-4" onClick={runGpaCalculator} />

              {gpaAdvice && (
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-md p-4 text-sm text-secondary-700">
                  {gpaAdvice}
                </div>
              )}

              {gpaSuggestions && gpaSuggestions.isAchievable && gpaSuggestions.scenarios.length > 0 && (
                <div className="mt-6 bg-amber-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-xl text-secondary-500">💡</div>
                    <div>
                      <h3 className="text-base font-semibold text-secondary-800">Smart Recommendations</h3>
                      <p className="text-sm text-secondary-500 mt-1">
                        {gpaSuggestions.isClosestFallback
                          ? "These are the closest course combinations based on your inputs. Click any scenario for details."
                          : "Here are different course combinations to achieve your target. Click any scenario for details."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {gpaSuggestions.scenarios.slice(0, 4).map((scenario, idx) => (
                      <div
                        key={idx}
                        className={`border p-4 rounded-lg cursor-pointer transition-all ${
                          expandedScenario === idx
                            ? "bg-slate-50 border-slate-300 shadow-sm"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                        onClick={() => setExpandedScenario(expandedScenario === idx ? -1 : idx)}
                      >
                        {/* Summary Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-secondary-800">
                              Scenario {idx + 1}
                              {idx === 0 && (
                                <span className="ml-2 inline-block bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded">
                                  Easiest
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-secondary-600 mt-1">
                              {scenario.num3Credit} × 3-credit + {scenario.num2Credit} × 2-credit
                              ({scenario.totalCredits} credits total)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-secondary-800">
                              {getEffortLabel(scenario.effort, scenario.num3Credit + scenario.num2Credit)}
                            </div>
                            <div className="text-xs text-secondary-600 mt-1">
                              {scenario.effort} high grades needed
                            </div>
                          </div>
                          <div className="ml-4 text-secondary-400">
                            {expandedScenario === idx ? "▼" : "▶"}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedScenario === idx && (
                          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                            {Array.isArray(scenario.subjectGrades) && scenario.subjectGrades.length > 0 && (
                              <div className="bg-white border border-slate-200 rounded-md px-3 py-2">
                                <p className="text-xs font-semibold text-secondary-600 uppercase mb-2">Subject-Level Minimum Grades</p>
                                <div className="space-y-2">
                                  {scenario.subjectGrades.map((subject) => (
                                    <div key={subject.subjectCode} className="flex items-center justify-between text-sm">
                                      <div className="text-secondary-700">
                                        <span className="font-semibold">{subject.subjectCode}</span> - {subject.subjectName}
                                        <span className="text-xs text-secondary-500 ml-2">({subject.creditHours} credits)</span>
                                      </div>
                                      <div className="w-[2ch] text-left font-mono font-bold text-secondary-800">
                                        {subject.recommendedGrade}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="bg-white border border-slate-200 rounded-md px-3 py-2">
                              <p className="text-xs font-semibold text-secondary-600 uppercase mb-2">Required Grade Distribution</p>
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                {Object.entries(scenario.gradeDistribution)
                                  .sort((a, b) => {
                                    const gradeOrder = [
                                      "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "E"
                                    ];
                                    return gradeOrder.indexOf(a[0]) - gradeOrder.indexOf(b[0]);
                                  })
                                  .map(([grade, count]) => (
                                    <div key={grade} className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-secondary-700 min-w-12">
                                        {grade}:
                                      </span>
                                      <span className="text-sm font-bold text-secondary-900">{count}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                              <p className="text-xs font-semibold text-secondary-700 uppercase mb-1">Math Check</p>
                              <p className="text-xs text-secondary-600">
                                Total points needed: <span className="font-bold">{scenario.totalPointsNeeded.toFixed(1)}</span> |
                                Target GPA: <span className="font-bold">{scenario.requiredGPA.toFixed(3)}</span>
                              </p>
                            </div>

                            <div className="text-xs text-secondary-600">
                              <p>
                                <strong>What this means:</strong> Earn{" "}
                                {Object.entries(scenario.gradeDistribution)
                                  .filter(([, count]) => count > 0)
                                  .map(([grade, count]) => `${count} ${grade}${count > 1 ? "" : ""}`)
                                  .join(" + ")}{" "}
                                in your {scenario.num3Credit + scenario.num2Credit} courses.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {gpaSuggestions.scenarios.length > 4 && (
                      <div className="text-center">
                        <p className="text-xs text-secondary-600">
                          + {gpaSuggestions.scenarios.length - 4} more scenarios available
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
                    <p className="text-xs text-secondary-600">
                      <strong className="text-secondary-800">How to use:</strong>{" "}
                      {gpaSuggestions.isClosestFallback
                        ? "Showing the closest combinations based on your next semester subjects. The easiest option requires fewer"
                        : "Showing combinations that would help you reach your target. The easiest option requires fewer"}{" "}
                      <em>A's and B's</em>. Choose based on the courses available to you and your confidence level.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        renderEmptyState()
      )}

      <SemesterModal
        isOpen={isAddModalOpen}
        title="Add Semester Results"
        form={semesterForm}
        setForm={setSemesterForm}
        availableCourses={availableCourses}
        isCoursesLoading={loadingCourses}
        onClose={closeModals}
        onSubmit={saveSemester}
        isSaving={saving}
      />

      <SemesterModal
        isOpen={isEditModalOpen}
        title="Edit Semester Results"
        form={semesterForm}
        setForm={setSemesterForm}
        availableCourses={availableCourses}
        isCoursesLoading={loadingCourses}
        onClose={closeModals}
        onSubmit={saveSemester}
        isSaving={saving}
      />
    </div>
  );
}
