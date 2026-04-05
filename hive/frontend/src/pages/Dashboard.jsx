import StudySessionCalendar from "./StudySession";
import { useEffect, useState } from "react";
import { getAllSessions } from "@/services";
import { useAuth } from "../context/AuthContext";

import PomodoroTimer from "@/components/PomodoroTimer";
import UpcomingTasks from "@/components/UpcomingTasks";
import GPAWidget from "@/components/GPAWidget";


export default function Dashboard() {
  const { authData } = useAuth();
  const displayName = authData?.name || "Student";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      setLoading(true);
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
        console.error("Failed to fetch sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingTasks();
  }, []);

  return (
    <div>
      {/* Greeting */}
      <h2 className="text-lg font-semibold text-secondary-800 mb-5">
        Hey {displayName}! 🐝 Let's buzz through today's tasks together!
      </h2>

      {/* Multi-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="md:col-span-2 lg:col-span-2 space-y-6 lg:sticky lg:top-24 self-start">
          <StudySessionCalendar isUpcomingTasks={false} hideListView={true} isDashboard={true} />

        </div>

        {/* Right: Sidebar widgets */}
        <div className="flex flex-col gap-6">
          {/* Pomodoro Timer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm min-h-[300px]" id="pomodoro-timer-slot">
            {/* The global timer will portal here */}
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <UpcomingTasks tasks={tasks.slice(0, 5)} loading={loading} />
          </div>

          {/* GPA Widget */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <GPAWidget />
          </div>
        </div>
      </div>
    </div>
  );
}