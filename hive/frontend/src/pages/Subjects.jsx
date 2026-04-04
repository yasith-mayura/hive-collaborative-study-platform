import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { getAllCourses } from "@/services/resourceService";
import { getMyAssignedLevel } from "@/services";

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

  const canViewStats = role === "admin" || role === "superadmin";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedLevel, setAssignedLevel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const [coursesResponse, levelResponse] = await Promise.all([
        getAllCourses(),
        role === "superadmin"
          ? Promise.resolve({ hasRestriction: false, level: null })
          : getMyAssignedLevel(),
      ]);

      setCourses(coursesResponse?.courses || []);
      setAssignedLevel(levelResponse?.hasRestriction ? Number(levelResponse.level) : null);
    } catch (error) {
      if (error?.response?.status === 404) {
        setCourses([]);
        setAssignedLevel(null);
      } else {
        toast.error(getErrorMessage(error, "Failed to load courses"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [role]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        course.subjectName?.toLowerCase().includes(query) ||
        course.subjectCode?.toLowerCase().includes(query);

      const matchesLevel = assignedLevel === null || Number(course.level) === Number(assignedLevel);

      return matchesSearch && matchesLevel;
    });
  }, [courses, searchQuery, assignedLevel]);

  const visibleLevels = useMemo(() => {
    return assignedLevel === null ? [1, 2, 3, 4] : [assignedLevel];
  }, [assignedLevel]);

  const coursesByLevel = useMemo(() => {
    return visibleLevels
      .map((level) => {
        const semesterGroups = [1, 2]
          .map((semester) => {
            const semesterCourses = filteredCourses.filter(
              (course) => Number(course.level) === level && Number(course.semester) === semester
            );

            return semesterCourses.length > 0
              ? { semester, courses: semesterCourses }
              : null;
          })
          .filter(Boolean);

        return semesterGroups.length > 0 ? { level, semesterGroups } : null;
      })
      .filter(Boolean);
  }, [filteredCourses, visibleLevels]);

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
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by course name or code"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No courses found.
        </div>
      ) : (
        <div className="space-y-6">
          {coursesByLevel.map(({ level, semesterGroups }) => (
            <div key={level} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Level {level}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {semesterGroups.map(({ semester, courses: semesterCourses }) => (
                  <div key={`${level}-${semester}`} className="border border-gray-200 rounded-md p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Semester {semester}</h3>
                    <div className="space-y-2">
                      {semesterCourses.map((course) => (
                        <button
                          type="button"
                          key={course.subjectCode}
                          onClick={() => navigate(`/resources/subjects/${course.subjectCode}`)}
                          className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 px-3 py-2"
                        >
                          <p className="text-xs text-gray-500">{course.subjectCode}</p>
                          <p className="text-sm font-medium text-gray-800">{course.subjectName}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
