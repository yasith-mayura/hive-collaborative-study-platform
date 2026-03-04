const StudySession = require("../models/studySessionModel");

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
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);

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

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ message: "Month must be between 1 and 12" });
    }
    const sessions = await StudySession.aggregate([
      {
        $addFields: { month: { $month: "$date" } } 
      },
      { $match: { month: month } },
      { $sort: { date: 1 } },
      { $project: { month: 0 } }
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
    const { type, topic, description, date, time } = req.body;
    const session = await StudySession.create({ type, topic, description, date, time });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const session = await StudySession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.status(200).json(session);
  } catch (error) {
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
