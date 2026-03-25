// src/controllers/noteController.js
const Note = require('../models/noteModel');

// GET notes (for logged-in user)
async function getNotes(req, res) {
  try {
    const notes = await Note.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    return res.json(notes); // return to prevent further execution
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// CREATE note
async function createNote(req, res) {
  try {
    const { content, isVoiceNote } = req.body;

    const note = new Note({
      userId: req.user.uid, // Firebase UID
      title: content.substring(0, 20), // auto-generate title
      content,
      isVoiceNote: isVoiceNote || false,
    });

    await note.save();
    return res.status(201).json(note);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// DELETE note
async function deleteNote(req, res) {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);

    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    return res.json({ message: 'Note deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// UPDATE note
async function updateNote(req, res) {
  try {
    const { content, title } = req.body; // accept both fields

    const updateData = {};

    if (content !== undefined) {
      updateData.content = content;
      // auto-update title only if title not explicitly provided
      if (title === undefined) updateData.title = content.substring(0, 20);
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } // return updated note
    );

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    return res.json(updatedNote);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getNotes,
  createNote,
  deleteNote,
  updateNote,
};