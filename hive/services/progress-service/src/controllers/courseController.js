const Course = require('../models/Course');

const normalizeCourseCode = (courseCode = '') => String(courseCode).trim().toUpperCase();

const groupCourses = (courses = []) => {
  const groupedMap = new Map();

  courses.forEach((course) => {
    const key = `${course.year}-${course.semester}`;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        year: course.year,
        semester: course.semester,
        courses: [],
      });
    }
    groupedMap.get(key).courses.push(course);
  });

  return Array.from(groupedMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.semester - b.semester;
  });
};

const getCourses = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.year) {
      filter.year = Number(req.query.year);
    }

    if (req.query.semester) {
      filter.semester = Number(req.query.semester);
    }

    const courses = await Course.find(filter)
      .sort({ year: 1, semester: 1, status: 1, courseCode: 1 })
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
    const courseCode = normalizeCourseCode(req.params.courseCode);
    const course = await Course.findOne({ courseCode, isActive: true }).lean();

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
      courseCode: normalizeCourseCode(req.body.courseCode),
      courseName: req.body.courseName,
      year: Number(req.body.year),
      semester: Number(req.body.semester),
      status: req.body.status,
      specialisationTrack: req.body.specialisationTrack || null,
      isActive: true,
    };

    const existing = await Course.findOne({ courseCode: payload.courseCode }).lean();
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
    const currentCode = normalizeCourseCode(req.params.courseCode);
    const course = await Course.findOne({ courseCode: currentCode });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const nextCode = req.body.courseCode ? normalizeCourseCode(req.body.courseCode) : currentCode;

    if (nextCode !== currentCode) {
      const duplicate = await Course.findOne({ courseCode: nextCode }).lean();
      if (duplicate) {
        return res.status(409).json({ message: 'Course code already exists' });
      }
      course.courseCode = nextCode;
    }

    if (typeof req.body.courseName !== 'undefined') {
      course.courseName = req.body.courseName;
    }
    if (typeof req.body.year !== 'undefined') {
      course.year = Number(req.body.year);
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
    const courseCode = normalizeCourseCode(req.params.courseCode);
    const course = await Course.findOne({ courseCode });

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
