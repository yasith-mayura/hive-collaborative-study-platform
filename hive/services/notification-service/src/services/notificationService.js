const Notification = require('../models/Notification');

const createNotification = async (userId, title, message, type, data = {}) => {
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    data,
  });

  return notification;
};

const createBulkNotifications = async (userIds = [], title, message, type, data = {}) => {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];
  if (uniqueUserIds.length === 0) {
    return { created: 0 };
  }

  const docs = uniqueUserIds.map((userId) => ({
    userId,
    title,
    message,
    type,
    data,
  }));

  await Notification.insertMany(docs, { ordered: false });

  return { created: uniqueUserIds.length };
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (normalizedPage - 1) * normalizedLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit)
      .lean(),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    total,
    page: normalizedPage,
    limit: normalizedLimit,
  };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { notificationId, userId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    return null;
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};

const deleteNotification = async (notificationId, userId) => {
  const deleted = await Notification.findOneAndDelete({ notificationId, userId });
  return deleted;
};

const clearReadNotifications = async (userId) => {
  const result = await Notification.deleteMany({ userId, isRead: true });
  return { deletedCount: result.deletedCount || 0 };
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, isRead: false });
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadCount,
};
