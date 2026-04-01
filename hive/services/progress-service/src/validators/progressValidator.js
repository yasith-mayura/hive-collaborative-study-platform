const { body, param, validationResult } = require('express-validator');

const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'];
const courseStatus = ['compulsory', 'optional', 'specialisation'];
const tracks = ['Net', 'Mobile', 'Data', 'Health', 'Gaming', 'Business'];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};

const semesterPayloadValidation = [
  body('year')
    .trim()
    .matches(/^(\d{4}\/\d{4}|Y[1-4])$/i)
    .withMessage('Academic year must be in YYYY/YYYY format or Y1-Y4 format'),
  body('semester')
    .isInt({ min: 1, max: 2 })
    .withMessage('Semester must be either 1 or 2'),
  body('modules')
    .isArray({ min: 1 })
    .withMessage('At least one module is required'),
  body('modules.*.moduleCode')
    .trim()
    .notEmpty()
    .withMessage('Module code is required'),
  body('modules.*.moduleName')
    .trim()
    .notEmpty()
    .withMessage('Module name is required'),
  body('modules.*.creditHours')
    .isFloat({ min: 1, max: 9 })
    .withMessage('Credit hours must be between 1 and 9'),
  body('modules.*.grade')
    .isIn(grades)
    .withMessage('Invalid grade value'),
  validateRequest,
];

const semesterIdValidation = [
  param('semesterId').trim().notEmpty().withMessage('semesterId is required'),
  validateRequest,
];

const userIdValidation = [
  param('userId').trim().notEmpty().withMessage('userId is required'),
  validateRequest,
];

const courseCodeParamValidation = [
  param('courseCode').trim().notEmpty().withMessage('courseCode is required'),
  validateRequest,
];

const createCourseValidation = [
  body('courseCode').trim().notEmpty().withMessage('courseCode is required'),
  body('courseName').trim().notEmpty().withMessage('courseName is required'),
  body('year').isInt({ min: 1, max: 4 }).withMessage('year must be between 1 and 4'),
  body('semester').isInt({ min: 1, max: 2 }).withMessage('semester must be 1 or 2'),
  body('status').isIn(courseStatus).withMessage('Invalid course status'),
  body('specialisationTrack')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(tracks)
    .withMessage('Invalid specialisation track'),
  validateRequest,
];

const updateCourseValidation = [
  body('courseCode').optional().trim().notEmpty().withMessage('courseCode cannot be empty'),
  body('courseName').optional().trim().notEmpty().withMessage('courseName cannot be empty'),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('year must be between 1 and 4'),
  body('semester').optional().isInt({ min: 1, max: 2 }).withMessage('semester must be 1 or 2'),
  body('status').optional().isIn(courseStatus).withMessage('Invalid course status'),
  body('specialisationTrack')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(tracks)
    .withMessage('Invalid specialisation track'),
  validateRequest,
];

module.exports = {
  semesterPayloadValidation,
  semesterIdValidation,
  userIdValidation,
  courseCodeParamValidation,
  createCourseValidation,
  updateCourseValidation,
};
