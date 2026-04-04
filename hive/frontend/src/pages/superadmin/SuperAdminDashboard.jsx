import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllStudents,
  getAllAdmins,
  getAllCourses,
  getCurrentMonthSessions,
  getAllUsers,
  getAllSessions,
} from "@/services";
import Icon from "@/components/ui/Icon";

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const displayName = user?.displayName || "Super Admin";

  const [studentCount, setStudentCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);
  const [monthSessionCount, setMonthSessionCount] = useState(0);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [students, admins, subjects, monthSessions, allUsers, allSessions] =
          await Promise.allSettled([
            getAllStudents(),
            getAllAdmins(),
            getAllCourses(),
            getCurrentMonthSessions(),
            getAllUsers(),
            getAllSessions(),
          ]);

        // Stats
        const studentData = students.status === "fulfilled" ? students.value : [];
        const adminData = admins.status === "fulfilled" ? admins.value : [];
        const subjectData = subjects.status === "fulfilled" ? subjects.value : [];
        const subjectList = Array.isArray(subjectData)
          ? subjectData
          : subjectData?.courses || [];
        const monthSessionData = monthSessions.status === "fulfilled" ? monthSessions.value : [];

        setStudentCount(Array.isArray(studentData) ? studentData.length : 0);
        setAdminCount(Array.isArray(adminData) ? adminData.length : 0);
        setSubjectCount(subjectList.length);
        setMonthSessionCount(Array.isArray(monthSessionData) ? monthSessionData.length : 0);

        // Build activity feed from recent users and sessions
        const feed = [];

        const userData = allUsers.status === "fulfilled" ? allUsers.value || [] : [];
        userData
          .filter((u) => u.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 8)
          .forEach((u) => {
            feed.push({
              id: `user-${u._id || u.studentNumber}`,
              icon: u.role === "admin" ? "shield-check" : "user-plus",
              iconColor: u.role === "admin" ? "#BDA3FF" : "#50C793",
              iconBg: u.role === "admin" ? "#F4EEFF" : "#EAF9EE",
              text:
                u.role === "admin"
                  ? `${u.name} was added as an admin`
                  : `${u.name} registered as a student`,
              detail: u.studentNumber || u.email?.toLowerCase(),
              time: u.createdAt,
            });
          });

        const sessionData = allSessions.status === "fulfilled" ? allSessions.value || [] : [];
        sessionData
          .filter((s) => s.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 8)
          .forEach((s) => {
            feed.push({
              id: `session-${s._id}`,
              icon: "calendar",
              iconColor: "#FFCC00",
              iconBg: "#FFF4CC",
              text: `Study session created: ${s.topic || s.subjectCode}`,
              detail: `${s.subjectCode} · ${s.type}`,
              time: s.createdAt,
            });
          });

        // Sort all feed items by time descending, take latest 10
        feed.sort((a, b) => new Date(b.time) - new Date(a.time));
        setActivityFeed(feed.slice(0, 10));
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statCards = [
    {
      label: "No. of Students",
      value: studentCount,
      icon: "academic-cap",
      color: "#50C793",
      bg: "#EAF9EE",
    },
    {
      label: "No. of Admins",
      value: adminCount,
      icon: "shield-check",
      color: "#BDA3FF",
      bg: "#F4EEFF",
    },
    {
      label: "Courses",
      value: subjectCount,
      icon: "book-open",
      color: "#0CE7FA",
      bg: "#EAF8FF",
    },
    {
      label: "Sessions This Month",
      value: monthSessionCount,
      icon: "calendar",
      color: "#FFCC00",
      bg: "#FFF4CC",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <h2 className="text-lg font-semibold text-secondary-800 mb-6">
        Hey {displayName}! 🐝 Here's your platform overview
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: card.bg }}
            >
              <Icon
                icon={`heroicons-outline:${card.icon}`}
                className="w-6 h-6"
                style={{ color: card.color }}
              />
            </div>
            <div>
              <p className="text-sm text-secondary-500">{card.label}</p>
              <p className="text-3xl font-bold text-secondary-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Icon
            icon="heroicons-outline:clock"
            className="w-5 h-5 text-secondary-500"
          />
          <h3 className="text-base font-semibold text-secondary-800">
            Recent Activity
          </h3>
        </div>

        <div className="divide-y divide-gray-50">
          {activityFeed.length === 0 ? (
            <div className="px-6 py-10 text-center text-secondary-400 text-sm">
              No recent activity to show.
            </div>
          ) : (
            activityFeed.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.iconBg }}
                >
                  <Icon
                    icon={`heroicons-outline:${item.icon}`}
                    className="w-4.5 h-4.5"
                    style={{ color: item.iconColor }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-secondary-800 font-medium truncate">
                    {item.text}
                  </p>
                  <p className="text-xs text-secondary-400 mt-0.5">{item.detail}</p>
                </div>
                <span className="text-xs text-secondary-400 flex-shrink-0">
                  {formatTimeAgo(item.time)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}