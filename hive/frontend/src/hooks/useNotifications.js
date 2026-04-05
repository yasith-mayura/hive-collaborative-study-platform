import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearReadNotifications,
  deleteNotification,
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markOneAsRead,
} from "@/services/notificationService";

const DEFAULT_PAGE_SIZE = 20;

export default function useNotifications({ pageSize = DEFAULT_PAGE_SIZE, autoLoadList = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(autoLoadList);
  const [countLoading, setCountLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUnreadCount = useCallback(async () => {
    try {
      setCountLoading(true);
      const response = await getUnreadCount();
      setUnreadCount(Number(response?.count || 0));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load unread count");
    } finally {
      setCountLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(
    async (page = 1, limit = pageSize, mode = "replace") => {
      try {
        setLoading(true);
        setError("");
        const response = await getMyNotifications(page, limit);
        const loaded = Array.isArray(response?.notifications) ? response.notifications : [];

        setNotifications((prev) => (mode === "append" ? [...prev, ...loaded] : loaded));
        setUnreadCount(Number(response?.unreadCount || 0));
        setTotal(Number(response?.total || 0));
        return response;
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load notifications");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  const markAsRead = useCallback(async (notificationId) => {
    await markOneAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((item) =>
        item.notificationId === notificationId ? { ...item, isRead: true } : item
      )
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
  }, []);

  const markEverythingAsRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  }, []);

  const deleteOne = useCallback(async (notificationId) => {
    await deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((item) => item.notificationId !== notificationId));
    setTotal((prev) => Math.max(prev - 1, 0));
  }, []);

  const clearRead = useCallback(async () => {
    await clearReadNotifications();
    setNotifications((prev) => {
      const unread = prev.filter((item) => !item.isRead);
      setTotal(unread.length);
      return unread;
    });
  }, []);

  useEffect(() => {
    if (!autoLoadList) return;
    loadNotifications(1, pageSize, "replace");
  }, [autoLoadList, pageSize, loadNotifications]);

  useEffect(() => {
    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, 30000);
    return () => window.clearInterval(intervalId);
  }, [loadUnreadCount]);

  const hasMore = useMemo(() => notifications.length < total, [notifications.length, total]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    countLoading,
    error,
    hasMore,
    loadUnreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead: markEverythingAsRead,
    deleteOne,
    clearRead,
  };
}
