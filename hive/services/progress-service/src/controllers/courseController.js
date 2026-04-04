const Course = require('../models/Course');

const normalizeSubjectCode = (subjectCode = '') => String(subjectCode).trim().toUpperCase();

const groupCourses = (courses = []) => {
  const groupedMap = new Map();

  courses.forEach((course) => {
    const key = `${course.level}-${course.semester}`;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        level: course.level,
        semester: course.semester,
        courses: [],
      });
    }
    groupedMap.get(key).courses.push(course);
  });

  return Array.from(groupedMap.values()).sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.semester - b.semester;
  });
};

const getCourses = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.level || req.query.year) {
      filter.level = Number(req.query.level || req.query.year);
    }

    if (req.query.semester) {
      filter.semester = Number(req.query.semester);
    }

    const courses = await Course.find(filter)
      .sort({ level: 1, semester: 1, status: 1, subjectCode: 1 })
      .lean();

    return res.status(200).json({
      grouped: groupCourses(courses),
      courses,
      total: courses.length,
    });
  } catch (error) {
    console.error('getCourses error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getCourseByCode = async (req, res) => {
  try {
    const subjectCode = normalizeSubjectCode(req.params.subjectCode || req.params.courseCode);
    const course = await Course.findOne({ subjectCode, isActive: true }).lean();

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error('getCourseByCode error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const createCourse = async (req, res) => {
  try {
    const payload = {
      subjectCode: normalizeSubjectCode(req.body.subjectCode || req.body.courseCode),
      subjectName: req.body.subjectName || req.body.courseName,
      level: Number(req.body.level || req.body.year),
      semester: Number(req.body.semester),
      status: req.body.status,
      specialisationTrack: req.body.specialisationTrack || null,
      isActive: true,
    };

    const existing = await Course.findOne({ subjectCode: payload.subjectCode }).lean();
    if (existing) {
      return res.status(409).json({ message: 'Course code already exists' });
    }

    const created = await Course.create(payload);
    return res.status(201).json({ message: 'Course created successfully', data: created });
  } catch (error) {
    console.error('createCourse error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const currentCode = normalizeSubjectCode(req.params.subjectCode || req.params.courseCode);
    const course = await Course.findOne({ subjectCode: currentCode });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const nextCode = req.body.subjectCode
      ? normalizeSubjectCode(req.body.subjectCode)
      : req.body.courseCode
        ? normalizeSubjectCode(req.body.courseCode)
        : currentCode;

    if (nextCode !== currentCode) {
      const duplicate = await Course.findOne({ subjectCode: nextCode }).lean();
      if (duplicate) {
        return res.status(409).json({ message: 'Course code already exists' });
      }
      course.subjectCode = nextCode;
    }

    if (typeof req.body.subjectName !== 'undefined' || typeof req.body.courseName !== 'undefined') {
      course.subjectName = req.body.subjectName || req.body.courseName;
    }
    if (typeof req.body.level !== 'undefined' || typeof req.body.year !== 'undefined') {
      course.level = Number(req.body.level || req.body.year);
    }
    if (typeof req.body.semester !== 'undefined') {
      course.semester = Number(req.body.semester);
    }
    if (typeof req.body.status !== 'undefined') {
      course.status = req.body.status;
    }
    if (typeof req.body.specialisationTrack !== 'undefined') {
      course.specialisationTrack = req.body.specialisationTrack || null;
    }
    if (typeof req.body.isActive !== 'undefined') {
      course.isActive = Boolean(req.body.isActive);
    }

    await course.save();

    return res.status(200).json({ message: 'Course updated successfully', data: course });
  } catch (error) {
    console.error('updateCourse error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const subjectCode = normalizeSubjectCode(req.params.subjectCode || req.params.courseCode);
    const course = await Course.findOne({ subjectCode });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.isActive = false;
    await course.save();

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('deleteCourse error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = {
  getCourses,
  getCourseByCode,
  createCourse,
  updateCourse,
  deleteCourse,
};
