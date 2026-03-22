const StudySession = require("../models/studySessionModel");

const TIME_PATTERN = /^(0[1-9]|1[0-2])\.(0[0-9]|[1-5][0-9])\s(AM|PM)$/;

const parseSriLankaDate = (date, time) => {
  if (!date || !time) {
    throw new Error("Date and time are required");
  }

  if (!TIME_PATTERN.test(time)) {
    throw new Error("Time must be in format HH.MM AM/PM");
  }

  const [yearString, monthString, dayString] = date.split("-");
  const year = parseInt(yearString, 10);
  const month = parseInt(monthString, 10);
  const day = parseInt(dayString, 10);

  const [timePart, modifier] = time.split(" ");
  let [hours, minutes] = timePart.split(".");
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  // Persist UTC equivalent of Sri Lanka local date/time.
  return new Date(Date.UTC(year, month - 1, day, hours - 5, minutes - 30));
};

const isValidationError = (message = "") => {
  return message.includes("required") || message.includes("format");
};

//  Get All Sessions
const getAllSessions = async (req, res) => {
  try {
    const sessions = await StudySession.find().sort({ date: 1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};
const getCurrentMonthSessions = async (req, res) => {
  try {
    const now = new Date();

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const sessions = await StudySession.find({
      date: {
        $gte: firstDay,
        $lte: lastDay
      }
    }).sort({ date: 1 });

    res.status(200).json(sessions);

  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};
const getNextMonthSessions = async (req, res) => {
  try {
    const now = new Date();

    const firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);

    const sessions = await StudySession.find({
      date: {
        $gte: firstDay,
        $lte: lastDay
      }
    }).sort({ date: 1 });

    res.status(200).json(sessions);

  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

// Get sessions for a specific month 
const getSessionsByMonth = async (req, res) => {
  try {
    const month = parseInt(req.params.month, 10);
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ message: "Month must be between 1 and 12" });
    }

    if (!year || year < 1970 || year > 3000) {
      return res.status(400).json({ message: "Year must be valid" });
    }

    const sessions = await StudySession.aggregate([
      {
        $addFields: {
          month: { $month: "$date" },
          year: { $year: "$date" }
        }
      },
      { $match: { month, year } },
      { $sort: { date: 1 } },
      { $project: { month: 0, year: 0 } }
    ]);

    res.status(200).json(sessions);

  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

 //  Get Single Session
const getSessionById =async (req,res)=>{
    try {
           const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(session);
    } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
    }
} 
// Admin-only functions
const createSession = async (req, res) => {
  try {
    const { subjectCode, type, topic, description, date, time } = req.body;

    if (!subjectCode || !type || !topic || !description || !date || !time) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const sriLankaDate = parseSriLankaDate(date, time);

    const session = await StudySession.create({
      subjectCode,
      type,
      topic,
      description,
      date: sriLankaDate,
      time
    });

    res.status(201).json(session);

  } catch (error) {
    if (isValidationError(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create Session Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const existing = await StudySession.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Session not found" });

    const {
      subjectCode,
      type,
      topic,
      description,
      date,
      time,
    } = req.body;

    const updatePayload = {
      subjectCode: subjectCode ?? existing.subjectCode,
      type: type ?? existing.type,
      topic: topic ?? existing.topic,
      description: description ?? existing.description,
      time: time ?? existing.time,
    };

    if (!updatePayload.subjectCode || !updatePayload.type || !updatePayload.topic || !updatePayload.description || !updatePayload.time) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (date || time) {
      const localDate = date
        ? date
        : new Date(new Date(existing.date).getTime() + 5.5 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
      updatePayload.date = parseSriLankaDate(localDate, updatePayload.time);
    }

    const session = await StudySession.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.status(200).json(session);
  } catch (error) {
    if (isValidationError(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const session = await StudySession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

 module.exports = {
   getAllSessions ,
   getSessionById,
   getCurrentMonthSessions,
  getNextMonthSessions,
  getSessionsByMonth,
  createSession,
  updateSession,
  deleteSession
  };
