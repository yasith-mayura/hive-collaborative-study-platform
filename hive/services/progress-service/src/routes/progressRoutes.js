const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  semesterPayloadValidation,
  semesterIdValidation,
  userIdValidation,
  courseCodeParamValidation,
  createCourseValidation,
  updateCourseValidation,
} = require('../validators/progressValidator');
const {
  getProgress,
  getProgressByUserId,
  addSemester,
  updateSemester,
  deleteSemester,
  getSummary,
} = require('../controllers/progressController');
const {
  getCourses,
  getCourseByCode,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

const router = express.Router();

router.get('/', authMiddleware, getProgress);
router.get('/summary', authMiddleware, getSummary);
router.get('/courses', authMiddleware, getCourses);
router.get('/courses/:subjectCode', authMiddleware, courseCodeParamValidation, getCourseByCode);
router.post(
  '/courses',
  authMiddleware,
  requireRole('superadmin'),
  createCourseValidation,
  createCourse
);
router.put(
  '/courses/:subjectCode',
  authMiddleware,
  requireRole('superadmin'),
  courseCodeParamValidation,
  updateCourseValidation,
  updateCourse
);
router.delete(
  '/courses/:subjectCode',
  authMiddleware,
  requireRole('superadmin'),
  courseCodeParamValidation,
  deleteCourse
);
router.get('/:userId', authMiddleware, requireRole('admin', 'superadmin'), userIdValidation, getProgressByUserId);

router.post('/semester', authMiddleware, semesterPayloadValidation, addSemester);
router.put('/semester/:semesterId', authMiddleware, semesterIdValidation, semesterPayloadValidation, updateSemester);
router.delete('/semester/:semesterId', authMiddleware, semesterIdValidation, deleteSemester);

module.exports = router;
