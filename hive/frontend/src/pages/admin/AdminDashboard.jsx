import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllStudents, getAllSessions } from "@/services";
import StudySessionCalendar from "@/pages/StudySession";
import UpcomingTasks from "@/components/UpcomingTasks";

export default function AdminDashboard() {
  const { user } = useAuth();
  const displayName = user?.displayName || "Admin";

  const [studentCount, setStudentCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    getAllStudents()
      .then((data) => setStudentCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setStudentCount(0));

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
        </div>
      </div>
    </div>
  );
}
