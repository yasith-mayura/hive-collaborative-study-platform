require('dotenv').config();

const connectDB = require('./src/config/db');
const Course = require('./src/models/Course');

const courses = [
  { subjectCode: 'SENG 11213', subjectName: 'Fundamentals of Computing', level: 1, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 11223', subjectName: 'Programming Concepts', level: 1, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 11232', subjectName: 'Engineering Foundation', level: 1, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 11243', subjectName: 'Statistics', level: 1, semester: 1, status: 'compulsory' },
  { subjectCode: 'PMAT 11212', subjectName: 'Discreet Mathematics for Computing I A', level: 1, semester: 1, status: 'compulsory' },
  { subjectCode: 'DELT 11212', subjectName: 'English for Professionals', level: 1, semester: 1, status: 'compulsory' },

  { subjectCode: 'SENG 12213', subjectName: 'Data Structures and Algorithms', level: 1, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 12223', subjectName: 'Database Design and Development', level: 1, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 12233', subjectName: 'Object Oriented Programming', level: 1, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 12242', subjectName: 'Management for Software Engineering I', level: 1, semester: 2, status: 'compulsory' },
  { subjectCode: 'PMAT 12212', subjectName: 'Discreet Mathematics for Computing II B', level: 1, semester: 2, status: 'compulsory' },
  { subjectCode: 'DELT 12312', subjectName: 'Communication Skills for Professionals', level: 1, semester: 2, status: 'compulsory' },

  { subjectCode: 'SENG 21213', subjectName: 'Computer Architecture and Operating Systems', level: 2, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 21222', subjectName: 'Software Constructions', level: 2, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 21233', subjectName: 'Requirement Engineering', level: 2, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 21243', subjectName: 'Software Modelling', level: 2, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 21253', subjectName: 'Web Application Development', level: 2, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 21272', subjectName: 'Management for Software Engineering II', level: 2, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 31252', subjectName: 'Professional Practices', level: 2, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 21263', subjectName: 'Interactive Application Development', level: 2, semester: 1, status: 'optional' },

  { subjectCode: 'SENG 22212', subjectName: 'Software Architecture and Design', level: 2, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 22223', subjectName: 'Human Computer Interaction', level: 2, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 22233', subjectName: 'Software Verification and Validation', level: 2, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 22243', subjectName: 'Mobile Application Development', level: 2, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 24213', subjectName: 'Computer Networks', level: 2, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 22253', subjectName: 'Embedded Systems Development', level: 2, semester: 2, status: 'optional' },
  { subjectCode: 'PMAT 22213', subjectName: 'Mathematical Methods', level: 2, semester: 2, status: 'optional' },

  { subjectCode: 'SENG 31212', subjectName: 'Software Quality', level: 3, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 31222', subjectName: 'Information Security', level: 3, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 31232', subjectName: 'Software Project Management', level: 3, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 31242', subjectName: 'System Design Project', level: 3, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 31282', subjectName: 'Computer Network Management', level: 3, semester: 1, status: 'optional' },
  { subjectCode: 'SENG 31272', subjectName: 'Internet of Things', level: 3, semester: 1, status: 'optional' },
  { subjectCode: 'SENG 31292', subjectName: 'Enterprise Information Systems', level: 3, semester: 1, status: 'optional' },
  { subjectCode: 'SENG 31313', subjectName: 'Advanced Web Applications Development', level: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Net' },
  { subjectCode: 'SENG 31323', subjectName: 'Mobile Computing Technologies', level: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Mobile' },
  { subjectCode: 'SENG 31333', subjectName: 'Business Intelligence and Management Support Systems', level: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Data' },
  { subjectCode: 'SENG 31343', subjectName: 'Health Information Management', level: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Health' },
  { subjectCode: 'SENG 31353', subjectName: 'Game Development Technology', level: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Gaming' },
  { subjectCode: 'SENG 31363', subjectName: 'Business Systems Modelling and Optimization', level: 3, semester: 1, status: 'specialisation', specialisationTrack: 'Business' },

  { subjectCode: 'SENG 31262', subjectName: 'Research Methods', level: 3, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 34222', subjectName: 'Software Process', level: 3, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 34213', subjectName: 'Systems Development Project', level: 3, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 32216', subjectName: 'Internship', level: 3, semester: 2, status: 'compulsory' },

  { subjectCode: 'SENG 41212', subjectName: 'Software Evolution', level: 4, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 41222', subjectName: 'Software Metrics and Measurements', level: 4, semester: 1, status: 'compulsory' },
  { subjectCode: 'SENG 41233', subjectName: 'Digital Image Processing', level: 4, semester: 1, status: 'optional' },
  { subjectCode: 'SENG 41242', subjectName: 'Advanced Databases', level: 4, semester: 1, status: 'optional' },
  { subjectCode: 'SENG 41252', subjectName: 'Advanced Computer Networks', level: 4, semester: 1, status: 'optional' },
  { subjectCode: 'SENG 41262', subjectName: 'Speech Interfaces', level: 4, semester: 1, status: 'optional' },
  { subjectCode: 'SENG 41272', subjectName: 'Formal Methods', level: 4, semester: 1, status: 'optional' },
  { subjectCode: 'SENG 41283', subjectName: 'Distributed and Cloud Computing', level: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Net' },
  { subjectCode: 'SENG 41293', subjectName: 'Mobile Web Application Development', level: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Mobile' },
  { subjectCode: 'SENG 41303', subjectName: 'Big Data Infrastructure', level: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Data' },
  { subjectCode: 'SENG 41313', subjectName: 'Health Information Systems Design and Development', level: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Health' },
  { subjectCode: 'SENG 41323', subjectName: 'Games Design Artwork and Programming', level: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Gaming' },
  { subjectCode: 'SENG 41333', subjectName: 'Computer Based Operations Management', level: 4, semester: 1, status: 'specialisation', specialisationTrack: 'Business' },

  { subjectCode: 'SENG 42212', subjectName: 'Software Safety and Reliability', level: 4, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 43216', subjectName: 'Software Engineering Research Project', level: 4, semester: 2, status: 'compulsory' },
  { subjectCode: 'SENG 42222', subjectName: 'Usability Engineering', level: 4, semester: 2, status: 'optional' },
  { subjectCode: 'SENG 42232', subjectName: 'Software Management', level: 4, semester: 2, status: 'optional' },
  { subjectCode: 'SENG 42242', subjectName: 'Machine Learning', level: 4, semester: 2, status: 'optional' },
  { subjectCode: 'SENG 42252', subjectName: 'Computer Graphics', level: 4, semester: 2, status: 'optional' },
  { subjectCode: 'SENG 42273', subjectName: 'Semantic Web and Ontological Engineering', level: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Net' },
  { subjectCode: 'SENG 42283', subjectName: 'Mobile Networks', level: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Mobile' },
  { subjectCode: 'SENG 42293', subjectName: 'Big Data Analytics', level: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Data' },
  { subjectCode: 'SENG 42303', subjectName: 'Medical Imaging and Biomedical Signal Processing', level: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Health' },
  { subjectCode: 'SENG 42313', subjectName: 'Advanced Topics in Game Design and Animation', level: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Gaming' },
  { subjectCode: 'SENG 42323', subjectName: 'Business Process Engineering', level: 4, semester: 2, status: 'specialisation', specialisationTrack: 'Business' },
];

const seedCourses = async () => {
  await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

  let insertedOrUpdated = 0;

  for (const course of courses) {
    const normalizedCode = course.subjectCode.trim().toUpperCase();
    const extractedCredits = Course.extractCreditHours(normalizedCode);

    await Course.updateOne(
      { subjectCode: normalizedCode },
      {
        $set: {
          ...course,
          subjectCode: normalizedCode,
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
