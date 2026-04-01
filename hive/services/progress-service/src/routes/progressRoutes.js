const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  semesterPayloadValidation,
  semesterIdValidation,
  userIdValidation,
} = require('../validators/progressValidator');
const {
  getProgress,
  getProgressByUserId,
  addSemester,
  updateSemester,
  deleteSemester,
  getSummary,
} = require('../controllers/progressController');

const router = express.Router();

router.get('/', authMiddleware, getProgress);
router.get('/summary', authMiddleware, getSummary);
router.get('/:userId', authMiddleware, requireRole('admin', 'superadmin'), userIdValidation, getProgressByUserId);

router.post('/semester', authMiddleware, semesterPayloadValidation, addSemester);
router.put('/semester/:semesterId', authMiddleware, semesterIdValidation, semesterPayloadValidation, updateSemester);
router.delete('/semester/:semesterId', authMiddleware, semesterIdValidation, deleteSemester);

module.exports = router;
