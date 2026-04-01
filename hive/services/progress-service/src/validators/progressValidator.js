const { body, param, validationResult } = require('express-validator');

const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'];

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
    .matches(/^\d{4}\/\d{4}$/)
    .withMessage('Academic year must be in YYYY/YYYY format'),
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
    .isFloat({ min: 1, max: 4 })
    .withMessage('Credit hours must be between 1 and 4'),
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

module.exports = {
  semesterPayloadValidation,
  semesterIdValidation,
  userIdValidation,
};
