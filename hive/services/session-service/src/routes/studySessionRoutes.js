const express = require("express");
const router = express.Router();
const {
  getAllSessions,
  getSessionById,
  getCurrentMonthSessions,
  getNextMonthSessions,
  getSessionsByMonth,
  createSession,
  updateSession,
  deleteSession,
  getUpcomingSessionsForReminder,
} = require("../controllers/studySessionController");
const authMiddleware = require("../middleware/authMiddleware");
const {requireRole} = require("../middleware/roleMiddleware");
const { verifyServiceKey } = require('../middleware/serviceKeyMiddleware');

router.get('/internal/upcoming', verifyServiceKey, getUpcomingSessionsForReminder);

// Public routes
router.get("/", authMiddleware, getAllSessions);
router.get("/current-month", authMiddleware, getCurrentMonthSessions);
router.get("/next-month", authMiddleware, getNextMonthSessions);
router.get("/month/:month", authMiddleware, getSessionsByMonth);
router.get("/:id", authMiddleware, getSessionById);

// Admin-only routes
router.post("/", authMiddleware, requireRole("admin", "superadmin"), createSession);
router.put("/:id", authMiddleware, requireRole("admin", "superadmin"), updateSession);
router.delete("/:id", authMiddleware, requireRole("admin", "superadmin"), deleteSession);

// Backward-compatible legacy routes
router.post("/create", authMiddleware, requireRole("admin"), createSession);
router.put("/update/:id", authMiddleware, requireRole("admin"), updateSession);
router.delete("/delete/:id", authMiddleware, requireRole("admin"), deleteSession);

module.exports = router;