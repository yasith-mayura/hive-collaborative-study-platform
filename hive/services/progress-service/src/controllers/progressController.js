const Progress = require('../models/Progress');
const User = require('../models/User');

const GRADE_POINTS = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

const round2 = (value) => Number((value || 0).toFixed(2));

const calculateSemester = (semesterPayload) => {
  const modules = (semesterPayload.modules || []).map((module) => {
    const gradePoints = GRADE_POINTS[module.grade];
    return {
      moduleCode: module.moduleCode.trim(),
      moduleName: module.moduleName.trim(),
      creditHours: Number(module.creditHours),
      grade: module.grade,
      gradePoints,
    };
  });

  const totalCredits = modules.reduce((sum, module) => sum + module.creditHours, 0);
  const weightedPoints = modules.reduce(
    (sum, module) => sum + module.gradePoints * module.creditHours,
    0
  );

  const semesterGPA = totalCredits > 0 ? weightedPoints / totalCredits : 0;

  return {
    year: semesterPayload.year.trim(),
    semester: Number(semesterPayload.semester),
    modules,
    totalCredits,
    semesterGPA: round2(semesterGPA),
  };
};

const calculateCumulativeGPA = (semesters = []) => {
  const totalCredits = semesters.reduce((sum, semester) => sum + (semester.totalCredits || 0), 0);
  const weightedGpaSum = semesters.reduce(
    (sum, semester) => sum + (semester.semesterGPA || 0) * (semester.totalCredits || 0),
    0
  );

  if (totalCredits <= 0) {
    return 0;
  }

  return round2(weightedGpaSum / totalCredits);
};

const parseYearStart = (yearString = '') => {
  const [startYear] = yearString.split('/');
  const value = Number(startYear);
  return Number.isNaN(value) ? 0 : value;
};

const sortSemesters = (semesters = []) => {
  return [...semesters].sort((a, b) => {
    const byYear = parseYearStart(a.year) - parseYearStart(b.year);
    if (byYear !== 0) return byYear;
    return Number(a.semester) - Number(b.semester);
  });
};

const getStudentContext = async (uid) => {
  const user = await User.findOne({ firebaseUid: uid, isActive: true }).lean();
  if (!user) return null;

  return {
    userId: uid,
    name: user.name,
    studentNumber: user.studentNumber || 'N/A',
    role: user.role || 'student',
    batch: user.batch || null,
  };
};

const getProgress = async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      const users = await User.find({ role: 'student', isActive: true })
        .select('name studentNumber batch firebaseUid')
        .lean();
      const progressRows = await Progress.find({}).select('userId cumulativeGPA semesters').lean();

      const progressByUserId = new Map(progressRows.map((row) => [row.userId, row]));
      const summary = users.map((user) => {
        const record = progressByUserId.get(user.firebaseUid);
        return {
          userId: user.firebaseUid,
          studentName: user.name,
          studentNumber: user.studentNumber,
          level: user.batch,
          cumulativeGPA: record?.cumulativeGPA ?? 0,
          semestersRecorded: record?.semesters?.length ?? 0,
        };
      });

      return res.status(200).json(summary);
    }

    const record = await Progress.findOne({ userId: req.user.uid }).lean();
    if (!record) {
      return res.status(404).json({ message: 'No progress data found' });
    }

    return res.status(200).json(record);
  } catch (error) {
    console.error('getProgress error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getProgressByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const record = await Progress.findOne({ userId }).lean();
    if (!record) {
      return res.status(404).json({ message: 'No progress data found for this user' });
    }

    return res.status(200).json(record);
  } catch (error) {
    console.error('getProgressByUserId error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const addSemester = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'You do not have permission' });
    }

    const student = await getStudentContext(req.user.uid);
    if (!student) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    const computedSemester = calculateSemester(req.body);

    let progress = await Progress.findOne({ userId: student.userId });

    if (!progress) {
      progress = new Progress({
        userId: student.userId,
        studentNumber: student.studentNumber,
        semesters: [],
        cumulativeGPA: 0,
      });
    }

    const duplicate = progress.semesters.some(
      (semester) =>
        semester.year === computedSemester.year &&
        Number(semester.semester) === Number(computedSemester.semester)
    );

    if (duplicate) {
      return res.status(400).json({ message: 'Duplicate academic year and semester entry' });
    }

    progress.semesters.push(computedSemester);
    progress.semesters = sortSemesters(progress.semesters);
    progress.cumulativeGPA = calculateCumulativeGPA(progress.semesters);
    progress.updatedAt = new Date();

    await progress.save();

    return res.status(201).json({
      message: 'Semester added successfully',
      data: progress,
    });
  } catch (error) {
    console.error('addSemester error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const updateSemester = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'You do not have permission' });
    }

    const { semesterId } = req.params;
    const progress = await Progress.findOne({ userId: req.user.uid });

    if (!progress) {
      return res.status(404).json({ message: 'No progress data found' });
    }

    const semester = progress.semesters.id(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    const computedSemester = calculateSemester(req.body);

    const duplicate = progress.semesters.some(
      (entry) =>
        String(entry._id) !== String(semesterId) &&
        entry.year === computedSemester.year &&
        Number(entry.semester) === Number(computedSemester.semester)
    );

    if (duplicate) {
      return res.status(400).json({ message: 'Duplicate academic year and semester entry' });
    }

    semester.year = computedSemester.year;
    semester.semester = computedSemester.semester;
    semester.modules = computedSemester.modules;
    semester.totalCredits = computedSemester.totalCredits;
    semester.semesterGPA = computedSemester.semesterGPA;

    progress.semesters = sortSemesters(progress.semesters);
    progress.cumulativeGPA = calculateCumulativeGPA(progress.semesters);
    progress.updatedAt = new Date();

    await progress.save();

    return res.status(200).json({
      message: 'Semester updated successfully',
      data: progress,
    });
  } catch (error) {
    console.error('updateSemester error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const deleteSemester = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'You do not have permission' });
    }

    const { semesterId } = req.params;
    const progress = await Progress.findOne({ userId: req.user.uid });

    if (!progress) {
      return res.status(404).json({ message: 'No progress data found' });
    }

    const semester = progress.semesters.id(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    semester.deleteOne();

    progress.semesters = sortSemesters(progress.semesters);
    progress.cumulativeGPA = calculateCumulativeGPA(progress.semesters);
    progress.updatedAt = new Date();

    await progress.save();

    return res.status(200).json({
      message: 'Semester deleted successfully',
      data: progress,
    });
  } catch (error) {
    console.error('deleteSemester error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const getSummary = async (req, res) => {
  try {
    let targetUserId = req.user.uid;

    if ((req.user.role === 'admin' || req.user.role === 'superadmin') && req.query.userId) {
      targetUserId = req.query.userId;
    }

    const progress = await Progress.findOne({ userId: targetUserId }).lean();

    if (!progress) {
      return res.status(404).json({ message: 'No progress data found' });
    }

    const semesterGpas = progress.semesters.map((semester) => semester.semesterGPA);
    const totalCreditsCompleted = progress.semesters.reduce(
      (sum, semester) => sum + (semester.totalCredits || 0),
      0
    );

    return res.status(200).json({
      currentGPA: progress.cumulativeGPA || 0,
      highestSemesterGPA: semesterGpas.length ? round2(Math.max(...semesterGpas)) : 0,
      lowestSemesterGPA: semesterGpas.length ? round2(Math.min(...semesterGpas)) : 0,
      totalCreditsCompleted,
      totalSemestersRecorded: progress.semesters.length,
    });
  } catch (error) {
    console.error('getSummary error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = {
  GRADE_POINTS,
  calculateSemester,
  calculateCumulativeGPA,
  getProgress,
  getProgressByUserId,
  addSemester,
  updateSemester,
  deleteSemester,
  getSummary,
};
