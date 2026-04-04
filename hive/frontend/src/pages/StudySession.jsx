import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  createSession,
  deleteSession,
  getAllSessions,
  getCurrentMonthSessions,
  getAllCourses,
  getSessionById,
  getSessionsByMonth,
  updateSession,
} from "@/services";
import { useAuth } from "@/context/AuthContext";
import { getSubjectColor } from "@/lib/colors";
import Modal from "@/components/ui/Modal";
import UpcomingTasks from "@/components/UpcomingTasks";
import { toast } from "react-toastify";

const localizer = momentLocalizer(moment);

const SESSION_TYPES = [
  "Lecture",
  "Tutorial",
  "Lab",
  "Assignment",
  "Practical",
  "Revision",
  "Other",
];


const emptyForm = {
  subjectCode: "",
  type: "Lecture",
  topic: "",
  description: "",
  date: "",
  timeInput: "",
};

const parseDotTime = (timeString = "") => {
  const [timePart = "", modifier = "AM"] = timeString.trim().split(" ");
  const [hourPart = "00", minutePart = "00"] = timePart.split(".");
  let hour = Number(hourPart);
  const minute = Number(minutePart);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return { hour: 0, minute: 0 };
  }

  if (modifier === "PM" && hour !== 12) hour += 12;
  if (modifier === "AM" && hour === 12) hour = 0;

  return { hour, minute };
};

const from24HourToDotMeridiem = (timeValue) => {
  if (!timeValue || !timeValue.includes(":")) return "";

  const [hoursStr, minutesStr] = timeValue.split(":");
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${String(hours).padStart(2, "0")}.${String(minutes).padStart(2, "0")} ${period}`;
};

const to24HourInput = (dotTime) => {
  if (!dotTime) return "";
  const { hour, minute } = parseDotTime(dotTime);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const toSriLankaDate = (dateValue) => {
  const utcDate = new Date(dateValue);
  return new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
};

const toYmdDate = (dateValue) => {
  const date = toSriLankaDate(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDdMmYyyy = (dateValue) => {
  return toSriLankaDate(dateValue).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatFullDate = (dateValue) => {
  return toSriLankaDate(dateValue).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const combineSessionDateAndTime = (session) => {
  const base = toSriLankaDate(session.date);
  const { hour, minute } = parseDotTime(session.time);
  base.setHours(hour, minute, 0, 0);
  return base;
};

const sortByDateTimeAsc = (a, b) => combineSessionDateAndTime(a) - combineSessionDateAndTime(b);


const isSameMonth = (dateValue, referenceDate) => {
  const sessionDate = toSriLankaDate(dateValue);
  return (
    sessionDate.getMonth() === referenceDate.getMonth() &&
    sessionDate.getFullYear() === referenceDate.getFullYear()
  );
};

const isFutureOrToday = (session) => {
  const date = combineSessionDateAndTime(session);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

function SessionToolbar({ label, onNavigate, onView, view }) {
  const viewOptions = ["month", "week", "day", "agenda"];

  return (
    <div className="study-toolbar">
      <div className="study-toolbar-left">
        <button type="button" onClick={() => onNavigate("TODAY")}>Today</button>
        <button type="button" onClick={() => onNavigate("PREV")}>Back</button>
        <button type="button" onClick={() => onNavigate("NEXT")}>Next</button>
      </div>
      <h3 className="study-toolbar-title">{label}</h3>
      <div className="study-toolbar-right">
        {viewOptions.map((viewOption) => (
          <button
            key={viewOption}
            type="button"
            onClick={() => onView(viewOption)}
            className={view === viewOption ? "active" : ""}
          >
            {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StudySessionCalendar({ isUpcomingTasks = true, hideListView = false }) {
  const { viewMode } = useAuth();
  const isAdmin = viewMode === "admin" || viewMode === "superadmin";

  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allSessions, setAllSessions] = useState([]);
  const [monthSessions, setMonthSessions] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [accessibleCourses, setAccessibleCourses] = useState([]);

  const applyUpsert = useCallback((session) => {
    setAllSessions((prev) => {
      const exists = prev.some((item) => item._id === session._id);
      const next = exists
        ? prev.map((item) => (item._id === session._id ? session : item))
        : [...prev, session];
      return next.sort(sortByDateTimeAsc);
    });

    setMonthSessions((prev) => {
      const exists = prev.some((item) => item._id === session._id);
      const inCurrentMonth = isSameMonth(session.date, currentDate);

      if (!exists && !inCurrentMonth) {
        return prev;
      }

      const upserted = exists
        ? prev.map((item) => (item._id === session._id ? session : item))
        : [...prev, session];

      return upserted
        .filter((item) => isSameMonth(item.date, currentDate))
        .sort(sortByDateTimeAsc);
    });
  }, [currentDate]);

  const applyRemove = useCallback((sessionId) => {
    setAllSessions((prev) => prev.filter((item) => item._id !== sessionId));
    setMonthSessions((prev) => prev.filter((item) => item._id !== sessionId));
  }, []);

  const loadMonthSessions = useCallback(async (targetDate) => {
    setMonthLoading(true);
    try {
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      const sessions = await getSessionsByMonth(month, year);
      setMonthSessions((sessions || []).filter(isFutureOrToday).sort(sortByDateTimeAsc));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load calendar sessions.");
    } finally {
      setMonthLoading(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [all, currentMonth, courses] = await Promise.all([
        getAllSessions(),
        getCurrentMonthSessions(),
        isAdmin ? getAllCourses() : Promise.resolve({ courses: [] }),
      ]);
      setAllSessions((all || []).filter(isFutureOrToday).sort(sortByDateTimeAsc));
      setMonthSessions((currentMonth || []).filter(isFutureOrToday).sort(sortByDateTimeAsc));
      setAccessibleCourses(courses?.courses || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load study sessions.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const agendaSessions = useMemo(() => {
    return allSessions
      .filter((session) => {
        const date = combineSessionDateAndTime(session);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      })
      .sort(sortByDateTimeAsc);
  }, [allSessions]);

  const upcomingSessions = useMemo(() => agendaSessions.slice(0, 10), [agendaSessions]);

  const calendarSource = view === "month" ? monthSessions : allSessions;
  const events = useMemo(
    () =>
      calendarSource.map((session) => {
        const start = combineSessionDateAndTime(session);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          ...session,
          title: session.subjectCode,
          start,
          end,
        };
      }),
    [calendarSource]
  );

  const eventStyleGetter = (event) => {
    const palette = getSubjectColor(event.subjectCode || event.title);
    return {
      style: {
        backgroundColor: palette.bg,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        padding: "1px 6px",
      },
    };
  };

  const resetCreateForm = () => setCreateForm(emptyForm);

  const openSessionDetails = async (sessionOrId) => {
    const sessionId = typeof sessionOrId === "string" ? sessionOrId : sessionOrId._id;
    setIsDetailModalOpen(true);
    setIsEditing(false);
    setDetailLoading(true);

    try {
      const fullSession = await getSessionById(sessionId);
      setSelectedSession(fullSession);
      setEditForm({
        subjectCode: fullSession.subjectCode || "",
        type: fullSession.type || "Lecture",
        topic: fullSession.topic || "",
        description: fullSession.description || "",
        date: toYmdDate(fullSession.date),
        timeInput: to24HourInput(fullSession.time),
      });
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Failed to load session details");
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    const formattedTime = from24HourToDotMeridiem(createForm.timeInput);

    if (!formattedTime) {
      toast.error("Please select a valid time.");
      return;
    }

    if (!isAllowedSubjectCode(createForm.subjectCode)) {
      toast.error("Please select a course from your accessible level.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSession({
        subjectCode: createForm.subjectCode.trim(),
        type: createForm.type,
        topic: createForm.topic.trim(),
        description: createForm.description.trim(),
        date: createForm.date,
        time: formattedTime,
        batch: selectedCourse?.level ?? null,
      });

      applyUpsert(created);
      toast.success("Study session created successfully");
      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    if (!selectedSession?._id) return;

    const formattedTime = from24HourToDotMeridiem(editForm.timeInput);

    if (!formattedTime) {
      toast.error("Please select a valid time.");
      return;
    }

    if (!isAllowedSubjectCode(editForm.subjectCode)) {
      toast.error("Please select a course from your accessible level.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateSession(selectedSession._id, {
        subjectCode: editForm.subjectCode.trim(),
        type: editForm.type,
        topic: editForm.topic.trim(),
        description: editForm.description.trim(),
        date: editForm.date,
        time: formattedTime,
      });

      applyUpsert(updated);
      setSelectedSession(updated);
      setIsEditing(false);
      toast.success("Study session updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession?._id) return;
    const confirmed = window.confirm("Are you sure you want to delete this study session?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteSession(selectedSession._id);
      applyRemove(selectedSession._id);
      toast.success("Study session deleted successfully");
      setIsDetailModalOpen(false);
      setSelectedSession(null);
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete session");
    } finally {
      setDeleting(false);
    }
  };

  const handleNavigate = async (date, currentView) => {
    setCurrentDate(date);
    if (currentView === "month") {
      await loadMonthSessions(date);
    }
  };

  const updateCreateForm = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditForm = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedCourse = useMemo(
    () => accessibleCourses.find((course) => course.subjectCode === createForm.subjectCode.trim().toUpperCase()),
    [accessibleCourses, createForm.subjectCode]
  );

  const isAllowedSubjectCode = useCallback(
    (subjectCode) => {
      if (!isAdmin) return true;

      const normalizedCode = String(subjectCode || "").trim().toUpperCase();
      return accessibleCourses.some((course) => course.subjectCode === normalizedCode);
    },
    [accessibleCourses, isAdmin]
  );

  const subjectCodeOptions = useMemo(
    () => accessibleCourses.map((course) => ({
      subjectCode: course.subjectCode,
      subjectName: course.subjectName,
      level: course.level,
      semester: course.semester,
    })),
    [accessibleCourses]
  );

  return (
    <div className="min-h-screen bg-primary">
      <div className={`p-4 grid grid-cols-1 gap-6 ${isUpcomingTasks ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
        {/* Calendar Section */}
        <div
          className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${isUpcomingTasks ? "lg:col-span-2" : ""}`}
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            {isUpcomingTasks && (
              <h2 className="text-2xl text-gray-700 font-bold">
                Study Session Reminder
              </h2>
            )}

            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition font-semibold"
              >
                + Add Session
              </button>
            )}
          </div>

          <style>{`
            .rbc-calendar { font-family: "Inter", sans-serif; font-size: 13px; }

            .study-toolbar { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; margin-bottom: 12px; }
            .study-toolbar-left, .study-toolbar-right { display: flex; gap: 8px; }
            .study-toolbar-right { justify-content: flex-end; }
            .study-toolbar-title { text-align: center; color: #393E41; font-size: 16px; font-weight: 700; }

            .study-toolbar button { font-size: 13px; padding: 6px 12px; border: 1px solid #D2D6DC; border-radius: 6px; color: #393E41; background: #fff; }
            .study-toolbar button:hover { background: #F4F4F5; }
            .study-toolbar-right button.active { background: #393E41; color: #fff; border-color: #393E41; }

            .rbc-header { padding: 8px 4px; font-weight: 600; font-size: 13px; color: #6E7377; border-bottom: 1px solid #E5E7EB; }
            .rbc-month-view { border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
            .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row { border-color: #E5E7EB; }
            .rbc-off-range-bg { background: #FAFAFA; }
            .rbc-off-range .rbc-date-cell { color: #A0A4A7; }
            .rbc-today { background: #FFF8DE; }
            .rbc-date-cell { padding: 4px 8px; font-size: 13px; }
            .rbc-show-more { color: #FFCC00; font-weight: 600; font-size: 11px; }
            .rbc-event { box-shadow: none; }

            @media (max-width: 900px) {
              .study-toolbar { grid-template-columns: 1fr; }
              .study-toolbar-title { text-align: left; }
              .study-toolbar-right { justify-content: flex-start; flex-wrap: wrap; }
              .study-toolbar-left { flex-wrap: wrap; }
            }
          `}</style>

          {loading && (
            <div className="h-[520px] grid place-items-center text-secondary-600 font-medium">
              Loading study sessions...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-danger-700 mb-4">
              {error}
            </div>
          )}

          {!loading && (
            <>
              {monthLoading && view === "month" && (
                <div className="text-sm text-secondary-500 mb-3">Refreshing month view...</div>
              )}

              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                date={currentDate}
                onView={setView}
                onNavigate={handleNavigate}
                views={["month", "week", "day", "agenda"]}
                style={{ height: 520 }}
                popup
                messages={{ showMore: (total) => `+${total} more` }}
                components={{
                  toolbar: SessionToolbar,
                }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => openSessionDetails(event._id)}
                tooltipAccessor={(event) =>
                  `${event.title}\n${event.topic}\n${event.time}\n${event.type}`
                }
              />
            </>
          )}

          {!isAdmin && !hideListView && (
            <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-primary-50 px-4 py-3 font-semibold text-secondary-700">
                Session List View
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-gray-50 text-left text-sm text-secondary-600">
                    <tr>
                      <th className="px-4 py-3">Subject Code</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Topic</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSessions.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-secondary-500" colSpan={6}>
                          No sessions available.
                        </td>
                      </tr>
                    )}

                    {allSessions.map((session) => {
                      const sessionDateTime = combineSessionDateAndTime(session);
                      const isPast = sessionDateTime < new Date();
                      return (
                        <tr
                          key={session._id}
                          className={`border-t border-gray-100 cursor-pointer hover:bg-primary-50 ${isPast ? "text-gray-400" : "text-secondary-700"}`}
                          onClick={() => openSessionDetails(session._id)}
                        >
                          <td className="px-4 py-3 font-semibold">{session.subjectCode}</td>
                          <td className="px-4 py-3">{session.type}</td>
                          <td className="px-4 py-3">{session.topic}</td>
                          <td className="px-4 py-3">{formatDdMmYyyy(session.date)}</td>
                          <td className="px-4 py-3">{session.time}</td>
                          <td className="px-4 py-3">{session.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Tasks Sidebar */}
        {isUpcomingTasks && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-fit">
            <UpcomingTasks
              tasks={upcomingSessions}
              loading={loading}
              onTaskClick={(task) => openSessionDetails(task._id)}
            />
          </div>
        )}
      </div>

      <Modal
        title="Create Study Session"
        activeModal={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetCreateForm();
        }}
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject Code</label>
            {isAdmin ? (
              <>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white"
                  value={createForm.subjectCode}
                  onChange={(e) => updateCreateForm("subjectCode", e.target.value)}
                >
                  <option value="">Select a course</option>
                  {subjectCodeOptions.map((course) => (
                    <option key={course.subjectCode} value={course.subjectCode}>
                      {course.subjectCode} - {course.subjectName} (Level {course.level}, Semester {course.semester})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose from courses available to your assigned level.
                </p>
              </>
            ) : (
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                placeholder="e.g. SENG 41283"
                value={createForm.subjectCode}
                onChange={(e) => updateCreateForm("subjectCode", e.target.value)}
              />
            )}
            {selectedCourse && (
              <p className="text-xs text-primary-700 mt-1">
                {selectedCourse.subjectName} · Level {selectedCourse.level} · Semester {selectedCourse.semester}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Topic</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g. Intro to ML"
              value={createForm.topic}
              onChange={(e) => updateCreateForm("topic", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={createForm.type}
                onChange={(e) => updateCreateForm("type", e.target.value)}
              >
                {SESSION_TYPES.map((type) => (
                  <option value={type} key={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={createForm.date}
                onChange={(e) => updateCreateForm("date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={createForm.timeInput}
                onChange={(e) => updateCreateForm("timeInput", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Stored as {from24HourToDotMeridiem(createForm.timeInput) || "HH.MM AM/PM"}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="Additional details..."
              value={createForm.description}
              onChange={(e) => updateCreateForm("description", e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetCreateForm();
              }}
              className="mr-3 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 rounded-md"
            >
              {submitting ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title={isEditing ? "Edit Study Session" : "Session Details"}
        activeModal={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSession(null);
          setIsEditing(false);
        }}
      >
        {detailLoading && <p className="text-secondary-600">Loading session details...</p>}

        {!detailLoading && selectedSession && !isEditing && (
          <div className="space-y-4 text-secondary-700">
            <div>
              <p className="text-xs uppercase text-gray-500">Subject Code</p>
              <p className="font-semibold mt-1">{selectedSession.subjectCode}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Type</p>
              <p className="font-semibold mt-1">{selectedSession.type}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Topic</p>
              <p className="font-semibold mt-1">{selectedSession.topic}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Description</p>
              <p className="mt-1 leading-6">{selectedSession.description}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Date</p>
              <p className="mt-1 font-semibold">{formatFullDate(selectedSession.date)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Time</p>
              <p className="mt-1 font-semibold">{selectedSession.time}</p>
            </div>

            <div className="pt-4 flex justify-between items-center gap-3">
              <div>
                {isAdmin && (
                  <button
                    type="button"
                    disabled={deleting}
                    className="bg-danger-500 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-danger-600"
                    onClick={handleDeleteSession}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedSession(null);
                    setIsEditing(false);
                  }}
                >
                  Close
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    className="bg-primary-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 rounded-md"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!detailLoading && selectedSession && isEditing && (
          <form onSubmit={handleUpdateSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject Code</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={editForm.subjectCode}
                onChange={(e) => updateEditForm("subjectCode", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  value={editForm.type}
                  onChange={(e) => updateEditForm("type", e.target.value)}
                >
                  {SESSION_TYPES.map((type) => (
                    <option value={type} key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  value={editForm.date}
                  onChange={(e) => updateEditForm("date", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Topic</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  value={editForm.topic}
                  onChange={(e) => updateEditForm("topic", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  value={editForm.timeInput}
                  onChange={(e) => updateEditForm("timeInput", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Stored as {from24HourToDotMeridiem(editForm.timeInput) || "HH.MM AM/PM"}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={editForm.description}
                onChange={(e) => updateEditForm("description", e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={handleDeleteSession}
                disabled={deleting}
                className="bg-danger-500 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-danger-600"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 rounded-md"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}