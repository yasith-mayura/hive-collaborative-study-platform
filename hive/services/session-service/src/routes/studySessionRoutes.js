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
  deleteSession
} = require("../controllers/studySessionController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// Public routes
router.get("/", getAllSessions);
router.get("/current-month", getCurrentMonthSessions);
router.get("/next-month", getNextMonthSessions);
router.get("/month/:month", getSessionsByMonth);

// Admin-only routes
router.post("/create", authMiddleware, requireRole("admin"), createSession);
router.put("/update/:id", authMiddleware, requireRole("admin"), updateSession);
router.delete("/delete/:id", authMiddleware, requireRole("admin"), deleteSession);

router.get("/:id", getSessionById);

module.exports = router;