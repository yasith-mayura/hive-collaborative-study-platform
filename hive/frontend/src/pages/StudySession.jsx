import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

// Custom event style (matches Dashboard)
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

export default function StudySessionCalendar({ isUpcomingTasks = true }) {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/studysession/")
      .then((res) => {
        const sessions = res.data;

        const calendarEvents = sessions.map((session) => {
          const utcDate = new Date(session.date);
          const localSriLankaDate = new Date(
            utcDate.getTime() + 5.5 * 60 * 60 * 1000
          );

          return {
            title: session.subjectCode,
            start: localSriLankaDate,
            end: localSriLankaDate,
            topic: session.topic,
            type: session.type,
            time: session.time,
            description: session.description,
          };
        });

        setEvents(calendarEvents);

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
      .catch((err) => {
        console.error("Failed to load study sessions:", err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-primary">
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Calendar Section */}
        <div
          className={`w-full bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${
            isUpcomingTasks ? "lg:w-4/5" : "lg:w-full"
          }`}
        >
          {isUpcomingTasks && (
            <h2 className="text-2xl text-gray-700 font-bold mb-6">
              Study Session Reminder
            </h2>
          )}

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
            views={["month", "week", "day", "agenda"]}
            style={{ height: 520 }}
            eventPropGetter={eventStyleGetter}
            tooltipAccessor={(event) =>
              `${event.title}\nTime: ${event.time}\nType: ${event.type}\nTopic: ${event.topic}`
            }
          />
        </div>

        {/* Upcoming Tasks Sidebar */}
        {isUpcomingTasks && (
          <div className="w-full lg:w-1/5 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-5 text-gray-800">
              Upcoming Tasks
            </h3>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => {
                const utc = new Date(task.date);
                const local = new Date(utc.getTime() + 5.5 * 60 * 60 * 1000);
                const dateStr = local.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });

                return (
                  <div
                    key={task._id}
                    className="bg-gray-50 p-4 rounded-lg border-l-4 border-yellow-400 shadow-sm"
                  >
                    <p className="font-semibold text-base text-gray-900">
                      {task.topic}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {dateStr} • {task.time}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{task.type}</p>
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No upcoming sessions.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}