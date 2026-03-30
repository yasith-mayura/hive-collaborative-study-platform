import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllStudents, getAllSubjects, getAllSessions } from "@/services";
import StudySessionCalendar from "@/pages/StudySession";
import UpcomingTasks from "@/components/UpcomingTasks";

const SUBJECT_DOT_COLORS = [
  "#FFCC00",
  "#50C793",
  "#0CE7FA",
  "#F68B8D",
  "#BDA3FF",
  "#FA916B",
  "#A0A4A7",
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const displayName = user?.displayName || "Admin";

  const [studentCount, setStudentCount] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    getAllStudents()
      .then((data) => setStudentCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setStudentCount(0));

    getAllSubjects()
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => setSubjects([]));

    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const sessions = await getAllSessions();
        const todayColombo = new Date();
        todayColombo.setHours(0, 0, 0, 0);

        const futureTasks = (sessions || [])
          .map((task) => {
            const utc = new Date(task.date);
            const local = new Date(utc.getTime() + 5.5 * 60 * 60 * 1000);
            return { ...task, localDate: local };
          })
          .filter((task) => task.localDate >= todayColombo)
          .sort((a, b) => a.localDate - b.localDate);

        setTasks(futureTasks);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <div>
      {/* Greeting */}
      <h2 className="text-lg font-semibold text-secondary-800 mb-5">
        Hey {displayName}! 🐝 You are managing 22/23 batch for year 1 sem 2
      </h2>

      {/* Main layout: calendar + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar — reuse the full StudySession component (admin CRUD built-in) */}
        <div className="lg:col-span-2">
          <StudySessionCalendar isUpcomingTasks={false} />
        </div>

        {/* Right sidebar widgets */}
        <div className="flex flex-col gap-6">
          {/* No. of Students */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-secondary-500 mb-2">No of students</p>
            <p className="text-5xl font-bold text-secondary-800">
              {studentCount}
            </p>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <UpcomingTasks tasks={tasks.slice(0, 4)} loading={loadingTasks} />
          </div>

          {/* Subjects with access */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-secondary-700 mb-3">
              Subjects with access
            </p>
            {subjects.length === 0 ? (
              <p className="text-sm text-secondary-400 italic">
                No subjects found.
              </p>
            ) : (
              <ul className="space-y-2">
                {subjects.map((subject, index) => (
                  <li key={subject._id || index} className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          SUBJECT_DOT_COLORS[index % SUBJECT_DOT_COLORS.length],
                      }}
                    />
                    <span className="text-sm text-secondary-700">
                      {subject.subjectCode || subject.name || "Untitled"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
