const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getBatchHistory } = require('../controllers/chatHistoryController');

// GET /api/chat/history/:batch
router.get('/history/:batch', authMiddleware, getBatchHistory);

module.exports = router;
