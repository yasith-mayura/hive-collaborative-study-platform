import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import Notification from "@/components/ui/Notification";
import useNotifications from "@/hooks/useNotifications";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "session", label: "Sessions" },
  { key: "resource", label: "Resources" },
  { key: "chat", label: "Chat" },
];

const iconByType = {
  session: "heroicons-outline:calendar-days",
  resource: "heroicons-outline:document-text",
  chat: "heroicons-outline:chat-bubble-left-right",
  user: "heroicons-outline:user",
  progress: "heroicons-outline:chart-bar",
  batch: "heroicons-outline:users",
};

const formatTimeAgo = (value) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffMs / day);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const NotificationRowSkeleton = () => {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 h-4 w-1/3 rounded bg-gray-200" />
      <div className="mb-2 h-3 w-full rounded bg-gray-100" />
      <div className="h-3 w-1/4 rounded bg-gray-100" />
    </div>
  );
};

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    notifications,
    loading,
    error,
    hasMore,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteOne,
    clearRead,
  } = useNotifications({ pageSize: 20, autoLoadList: true });

  const filteredNotifications = useMemo(() => {
    const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (activeFilter === "all") return sorted;
    if (activeFilter === "unread") return sorted.filter((item) => !item.isRead);
    return sorted.filter((item) => item.type === activeFilter);
  }, [notifications, activeFilter]);

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    const response = await loadNotifications(nextPage, 20, "append");
    if (response) {
      setCurrentPage(nextPage);
    }
  };

  const handleMarkRead = async (item) => {
    if (item.isRead) return;
    try {
      await markAsRead(item.notificationId);
    } catch (err) {
      Notification.error(err?.response?.data?.message || "Failed to mark as read");
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteOne(item.notificationId);
    } catch (err) {
      Notification.error(err?.response?.data?.message || "Failed to delete notification");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      Notification.error(err?.response?.data?.message || "Failed to mark all as read");
    }
  };

  const handleClearRead = async () => {
    try {
      await clearRead();
    } catch (err) {
      Notification.error(err?.response?.data?.message || "Failed to clear read notifications");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-semibold text-secondary-800">Notifications</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleMarkAll} className="btn btn-sm btn-outline-primary">
            Mark all as read
          </button>
          <button type="button" onClick={handleClearRead} className="btn btn-sm btn-outline-secondary">
            Clear all read
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              activeFilter === filter.key
                ? "bg-primary-300 text-primary-900"
                : "bg-primary-50 text-secondary-600 hover:bg-primary-100"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && notifications.length === 0 && (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <NotificationRowSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {!loading && !error && filteredNotifications.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-primary-50/50 px-4 py-8 text-center text-sm text-secondary-500">
          No notifications to show right now.
        </div>
      )}

      <div className="space-y-3">
        {filteredNotifications.map((item) => (
          <div
            key={item.notificationId}
            className={`rounded-lg border p-4 transition ${
              item.isRead ? "border-gray-200 bg-white" : "border-primary-200 bg-primary-50/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-primary-100 p-2 text-primary-800">
                <Icon icon={iconByType[item.type] || "heroicons-outline:bell"} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={`text-sm ${item.isRead ? "font-medium text-secondary-700" : "font-semibold text-secondary-900"}`}>
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-secondary-500">{item.message}</p>
                <p className="mt-2 text-xs text-gray-400">{formatTimeAgo(item.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(item)}
                    className="rounded-md border border-primary-200 px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-100"
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Icon icon="heroicons-outline:trash" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-5 text-center">
          <button type="button" onClick={handleLoadMore} className="btn btn-sm btn-outline-primary" disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
