import StudySessionCalendar from "./StudySession";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useAuth } from "@/context/authContext";
import PomodoroTimer from "@/components/PomodoroTimer";
import UpcomingTasks from "@/components/UpcomingTasks";
import GPAWidget from "@/components/GPAWidget";

const localizer = momentLocalizer(moment);

// Sample calendar events
const events = [
  {
    title: "",
    start: new Date(2025, 0, 1),
    end: new Date(2025, 0, 2),
  },
  {
    title: "4p Repeating Event",
    start: new Date(2025, 0, 7),
    end: new Date(2025, 0, 10),
  },
  {
    title: "4p Repeating Event",
    start: new Date(2025, 0, 14),
    end: new Date(2025, 0, 17),
  },
  {
    title: "7a Birthday Party",
    start: new Date(2025, 0, 31),
    end: new Date(2025, 0, 31),
  },
  {
    title: "10:30a Meeting",
    start: new Date(2025, 0, 30),
    end: new Date(2025, 0, 30),
  },
  {
    title: "12p Lunch",
    start: new Date(2025, 0, 30),
    end: new Date(2025, 0, 30),
  },
  {
    title: "2:30p Meeting",
    start: new Date(2025, 0, 30),
    end: new Date(2025, 0, 30),
  },
];

// Custom event style
const eventStyleGetter = () => ({
  style: {
    backgroundColor: "#FFCC00",
    color: "#4D3D00",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    padding: "2px 6px",
  },
});

export default function Dashboard() {
  const { authData } = useAuth();
  const displayName = authData?.name || "Student";

  const [tasks, setTasks] = useState([]);
  const { user } = useAuth();
  useEffect(() => {
    axios.get("http://localhost:3001/api/studysession/")
      .then((res) => {
        const sessions = res.data;
        const todayColombo = new Date();
        todayColombo.setHours(0, 0, 0, 0);

        const futureTasks = sessions
          .map((task) => {
            const utc = new Date(task.date);
            const local = new Date(utc.getTime() + 5.5 * 60 * 60 * 1000);
            return { ...task, localDate: local };
          })
          .filter((task) => task.localDate >= todayColombo)
          .sort((a, b) => a.localDate - b.localDate);

        setTasks(futureTasks);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      {/* Greeting */}
      <h2 className="text-lg font-semibold text-secondary-800 mb-5">
        Hey {displayName}! 🐝 Let's buzz through today's tasks together!
      </h2>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <style>{`
            .rbc-calendar {
              font-family: "Inter", sans-serif;
              font-size: 13px;
            }
            .rbc-toolbar {
              margin-bottom: 12px;
            }
            .rbc-toolbar button {
              font-size: 13px;
              padding: 4px 12px;
              border: 1px solid #D2D6DC;
              border-radius: 6px;
              color: #393E41;
              background: #fff;
            }
            .rbc-toolbar button.rbc-active {
              background: #393E41;
              color: #fff;
              border-color: #393E41;
            }
            .rbc-toolbar button:hover {
              background: #F4F4F5;
            }
            .rbc-toolbar button.rbc-active:hover {
              background: #24282A;
              color: #fff;
            }
            .rbc-header {
              padding: 8px 4px;
              font-weight: 600;
              font-size: 13px;
              color: #6E7377;
              border-bottom: 1px solid #E5E7EB;
            }
            .rbc-month-view {
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              overflow: hidden;
            }
            .rbc-day-bg + .rbc-day-bg,
            .rbc-month-row + .rbc-month-row {
              border-color: #E5E7EB;
            }
            .rbc-off-range-bg {
              background: #FAFAFA;
            }
            .rbc-today {
              background: #FFF8DE;
            }
            .rbc-date-cell {
              padding: 4px 8px;
              font-size: 13px;
            }
            .rbc-show-more {
              color: #FFCC00;
              font-weight: 600;
              font-size: 11px;
            }
          `}</style>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="month"
            defaultDate={new Date(2025, 0, 1)}
            views={["month", "week", "day", "agenda"]}
            style={{ height: 520 }}
            eventPropGetter={eventStyleGetter}
          />
        </div>

        {/* Right: Sidebar widgets */}
        <div className="flex flex-col gap-6">
          {/* Pomodoro Timer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <PomodoroTimer />
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <UpcomingTasks />
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