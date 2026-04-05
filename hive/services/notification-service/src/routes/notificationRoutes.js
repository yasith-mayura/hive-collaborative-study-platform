const express = require('express');
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyServiceKey } = require('../middleware/roleMiddleware');
const {
  getMyNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
  deleteOne,
  clearRead,
  sendNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', verifyToken, getMyNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.put('/:id/read', verifyToken, markOneAsRead);
router.put('/read-all', verifyToken, markAllAsRead);
router.delete('/clear-read', verifyToken, clearRead);
router.delete('/:id', verifyToken, deleteOne);

router.post(
  '/send',
  verifyServiceKey,
  [
    body('title').notEmpty(),
    body('message').notEmpty(),
    body('type').isIn(['session', 'resource', 'chat', 'user', 'progress', 'batch']),
  ],
  sendNotification
);

module.exports = router;
