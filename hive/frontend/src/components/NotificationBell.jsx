import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Notification from "@/components/ui/Notification";
import { useAuth } from "@/context/AuthContext";
import useNotifications from "@/hooks/useNotifications";

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

const NotificationSkeleton = () => {
  return (
    <div className="space-y-2 p-3">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="animate-pulse rounded-md border border-gray-100 p-3">
          <div className="mb-2 h-3 w-1/2 rounded bg-gray-200" />
          <div className="mb-2 h-2 w-full rounded bg-gray-100" />
          <div className="h-2 w-1/3 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
};

export default function NotificationBell() {
  const { viewMode } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    countLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteOne,
  } = useNotifications({ pageSize: 20, autoLoadList: true });

  const badgeValue = unreadCount > 9 ? "9+" : String(unreadCount);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notifications]);

  const handleBellClick = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      await loadNotifications(1, 20, "replace");
    }
  };

  const resolvePath = (item) => {
    if (item.type === "session") {
      if (viewMode === "admin") return "/admin/session";
      return "/session";
    }
    if (item.type === "resource") return "/resources";
    if (item.type === "chat") return "/chat";
    if (item.type === "progress") return "/progress";
    return "/notifications";
  };

  const handleNotificationClick = async (item) => {
    try {
      if (!item.isRead) {
        await markAsRead(item.notificationId);
      }
      navigate(resolvePath(item));
      setIsOpen(false);
    } catch (err) {
      Notification.error(err?.response?.data?.message || "Failed to open notification");
    }
  };

  const handleDelete = async (event, item) => {
    event.stopPropagation();
    try {
      await deleteOne(item.notificationId);
    } catch (err) {
      Notification.error(err?.response?.data?.message || "Failed to delete notification");
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleBellClick}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-secondary-500 hover:bg-primary-50"
        aria-label="Notifications"
      >
        {countLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-secondary-500" />
        ) : (
          <Icon icon="heroicons-outline:bell" className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1 text-xs font-semibold text-white">
            {badgeValue}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[100] mt-2 w-[360px] rounded-md border border-gray-200 bg-white shadow-base2">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-secondary-700">Notifications</h3>
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-primary-700 hover:text-primary-900"
            >
              Mark all read
            </button>
          </div>

          {loading ? (
            <NotificationSkeleton />
          ) : sortedNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-secondary-400">You have no notifications yet.</div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {sortedNotifications.slice(0, 20).map((item) => (
                <div
                  key={item.notificationId}
                  onClick={() => handleNotificationClick(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleNotificationClick(item);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`relative block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-primary-50 ${
                    item.isRead ? "bg-white" : "bg-primary-50/50"
                  }`}
                >
                  {!item.isRead && <span className="absolute left-0 top-0 h-full w-1 bg-primary-500" />}
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-full bg-primary-100 p-1 text-primary-800">
                      <Icon icon={iconByType[item.type] || "heroicons-outline:bell"} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${item.isRead ? "font-medium text-secondary-600" : "font-semibold text-secondary-800"}`}>
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-secondary-500">{item.message}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{formatTimeAgo(item.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => handleDelete(event, item)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Icon icon="heroicons-outline:x-mark" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-3 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary-700 hover:text-primary-900"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
