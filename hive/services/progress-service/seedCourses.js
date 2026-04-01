require('dotenv').config();

const connectDB = require('./src/config/db');
const Course = require('./src/models/Course');

const courses = [
  { courseCode: 'SENG 11213', courseName: 'Fundamentals of Computing', year: 1, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 11223', courseName: 'Programming Concepts', year: 1, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 11232', courseName: 'Engineering Foundation', year: 1, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 11243', courseName: 'Statistics', year: 1, semester: 1, status: 'compulsory' },
  { courseCode: 'PMAT 11212', courseName: 'Discreet Mathematics for Computing I A', year: 1, semester: 1, status: 'compulsory' },
  { courseCode: 'DELT 11212', courseName: 'English for Professionals', year: 1, semester: 1, status: 'compulsory' },

  { courseCode: 'SENG 12213', courseName: 'Data Structures and Algorithms', year: 1, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 12223', courseName: 'Database Design and Development', year: 1, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 12233', courseName: 'Object Oriented Programming', year: 1, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 12242', courseName: 'Management for Software Engineering I', year: 1, semester: 2, status: 'compulsory' },
  { courseCode: 'PMAT 12212', courseName: 'Discreet Mathematics for Computing II B', year: 1, semester: 2, status: 'compulsory' },
  { courseCode: 'DELT 12312', courseName: 'Communication Skills for Professionals', year: 1, semester: 2, status: 'compulsory' },

  { courseCode: 'SENG 21213', courseName: 'Computer Architecture and Operating Systems', year: 2, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 21222', courseName: 'Software Constructions', year: 2, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 21233', courseName: 'Requirement Engineering', year: 2, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 21243', courseName: 'Software Modelling', year: 2, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 21253', courseName: 'Web Application Development', year: 2, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 21272', courseName: 'Management for Software Engineering II', year: 2, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 31252', courseName: 'Professional Practices', year: 2, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 21263', courseName: 'Interactive Application Development', year: 2, semester: 1, status: 'optional' },

  { courseCode: 'SENG 22212', courseName: 'Software Architecture and Design', year: 2, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 22223', courseName: 'Human Computer Interaction', year: 2, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 22233', courseName: 'Software Verification and Validation', year: 2, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 22243', courseName: 'Mobile Application Development', year: 2, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 24213', courseName: 'Computer Networks', year: 2, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 22253', courseName: 'Embedded Systems Development', year: 2, semester: 2, status: 'optional' },
  { courseCode: 'PMAT 22213', courseName: 'Mathematical Methods', year: 2, semester: 2, status: 'optional' },

  { courseCode: 'SENG 31212', courseName: 'Software Quality', year: 3, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 31222', courseName: 'Information Security', year: 3, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 31232', courseName: 'Software Project Management', year: 3, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 31242', courseName: 'System Design Project', year: 3, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 31282', courseName: 'Computer Network Management', year: 3, semester: 1, status: 'optional' },
  { courseCode: 'SENG 31272', courseName: 'Internet of Things', year: 3, semester: 1, status: 'optional' },
  { courseCode: 'SENG 31292', courseName: 'Enterprise Information Systems', year: 3, semester: 1, status: 'optional' },
  { courseCode: 'SENG 31313', courseName: 'Advanced Web Applications Development', year: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Net' },
  { courseCode: 'SENG 31323', courseName: 'Mobile Computing Technologies', year: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Mobile' },
  { courseCode: 'SENG 31333', courseName: 'Business Intelligence and Management Support Systems', year: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Data' },
  { courseCode: 'SENG 31343', courseName: 'Health Information Management', year: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Health' },
  { courseCode: 'SENG 31353', courseName: 'Game Development Technology', year: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Gaming' },
  { courseCode: 'SENG 31363', courseName: 'Business Systems Modelling and Optimization', year: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Business' },

  { courseCode: 'SENG 31262', courseName: 'Research Methods', year: 3, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 34222', courseName: 'Software Process', year: 3, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 34213', courseName: 'Systems Development Project', year: 3, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 32216', courseName: 'Internship', year: 3, semester: 2, status: 'compulsory' },

  { courseCode: 'SENG 41212', courseName: 'Software Evolution', year: 4, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 41222', courseName: 'Software Metrics and Measurements', year: 4, semester: 1, status: 'compulsory' },
  { courseCode: 'SENG 41233', courseName: 'Digital Image Processing', year: 4, semester: 1, status: 'optional' },
  { courseCode: 'SENG 41242', courseName: 'Advanced Databases', year: 4, semester: 1, status: 'optional' },
  { courseCode: 'SENG 41252', courseName: 'Advanced Computer Networks', year: 4, semester: 1, status: 'optional' },
  { courseCode: 'SENG 41262', courseName: 'Speech Interfaces', year: 4, semester: 1, status: 'optional' },
  { courseCode: 'SENG 41272', courseName: 'Formal Methods', year: 4, semester: 1, status: 'optional' },
  { courseCode: 'SENG 41283', courseName: 'Distributed and Cloud Computing', year: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Net' },
  { courseCode: 'SENG 41293', courseName: 'Mobile Web Application Development', year: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Mobile' },
  { courseCode: 'SENG 41303', courseName: 'Big Data Infrastructure', year: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Data' },
  { courseCode: 'SENG 41313', courseName: 'Health Information Systems Design and Development', year: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Health' },
  { courseCode: 'SENG 41323', courseName: 'Games Design Artwork and Programming', year: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Gaming' },
  { courseCode: 'SENG 41333', courseName: 'Computer Based Operations Management', year: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Business' },

  { courseCode: 'SENG 42212', courseName: 'Software Safety and Reliability', year: 4, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 43216', courseName: 'Software Engineering Research Project', year: 4, semester: 2, status: 'compulsory' },
  { courseCode: 'SENG 42222', courseName: 'Usability Engineering', year: 4, semester: 2, status: 'optional' },
  { courseCode: 'SENG 42232', courseName: 'Software Management', year: 4, semester: 2, status: 'optional' },
  { courseCode: 'SENG 42242', courseName: 'Machine Learning', year: 4, semester: 2, status: 'optional' },
  { courseCode: 'SENG 42252', courseName: 'Computer Graphics', year: 4, semester: 2, status: 'optional' },
  { courseCode: 'SENG 42273', courseName: 'Semantic Web and Ontological Engineering', year: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Net' },
  { courseCode: 'SENG 42283', courseName: 'Mobile Networks', year: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Mobile' },
  { courseCode: 'SENG 42293', courseName: 'Big Data Analytics', year: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Data' },
  { courseCode: 'SENG 42303', courseName: 'Medical Imaging and Biomedical Signal Processing', year: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Health' },
  { courseCode: 'SENG 42313', courseName: 'Advanced Topics in Game Design and Animation', year: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Gaming' },
  { courseCode: 'SENG 42323', courseName: 'Business Process Engineering', year: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Business' },
];

const seedCourses = async () => {
  await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

  let insertedOrUpdated = 0;

  for (const course of courses) {
    const normalizedCode = course.courseCode.trim().toUpperCase();
    const extractedCredits = Course.extractCreditHours(normalizedCode);

    await Course.updateOne(
      { courseCode: normalizedCode },
      {
        $set: {
          ...course,
          courseCode: normalizedCode,
          creditHours: extractedCredits,
          isActive: true,
        },
      },
      { upsert: true }
    );
    insertedOrUpdated += 1;
  }

  console.log(`Course seeding completed. ${insertedOrUpdated} courses inserted/updated.`);
};

seedCourses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Course seeding failed:', error.message);
    process.exit(1);
  });
