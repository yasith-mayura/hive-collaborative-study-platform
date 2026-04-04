// src/controllers/noteController.js
const Note = require('../models/noteModel');
const FlashCardDeck = require("../models/flashCardModel");

//Note Model functions

const generateAutoTitle = (content = '') =>
  content
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');

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
    const { content, isVoiceNote, title } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const resolvedTitle = title && title.trim() ? title.trim() : generateAutoTitle(content);

    const note = new Note({
      userId: req.user.uid, // Firebase UID
      title: resolvedTitle,
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
    const { content, title } = req.body;

    const updateData = {};

    if (content !== undefined) {
      updateData.content = content;
    }

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
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

// FlashCardDeck Model functions
const normalizeCards = (cards = []) =>
  cards
    .map((card) => ({
      question: typeof card.question === "string" ? card.question.trim() : "",
      answer: typeof card.answer === "string" ? card.answer.trim() : "",
    }))
    .filter((card) => card.question && card.answer);

async function getFlashCardDecks(req, res) {
  try {
    const decks = await FlashCardDeck.find({ userId: req.user.uid }).sort({
      createdAt: -1,
    });

    return res.json(decks);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createFlashCardDeck(req, res) {
  try {
    const { name, cards } = req.body;
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const normalizedCards = normalizeCards(cards);

    if (!trimmedName) {
      return res.status(400).json({ message: "Deck name is required" });
    }

    if (normalizedCards.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one valid card is required" });
    }

    const deck = new FlashCardDeck({
      userId: req.user.uid,
      name: trimmedName,
      cards: normalizedCards,
    });

    await deck.save();
    return res.status(201).json(deck);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateFlashCardDeck(req, res) {
  try {
    const { name, cards } = req.body;
    const updateData = {};

    if (name !== undefined) {
      const trimmedName = typeof name === "string" ? name.trim() : "";
      if (!trimmedName) {
        return res.status(400).json({ message: "Deck name cannot be empty" });
      }
      updateData.name = trimmedName;
    }

    if (cards !== undefined) {
      const normalizedCards = normalizeCards(cards);
      if (normalizedCards.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one valid card is required" });
      }
      updateData.cards = normalizedCards;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updatedDeck = await FlashCardDeck.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      updateData,
      { new: true }
    );

    if (!updatedDeck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    return res.json(updatedDeck);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteFlashCardDeck(req, res) {
  try {
    const deletedDeck = await FlashCardDeck.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.uid,
    });

    if (!deletedDeck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    return res.json({ message: "Deck deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}


module.exports = {
  getNotes,
  createNote,
  deleteNote,
  updateNote,
  getFlashCardDecks,
  createFlashCardDeck,
  updateFlashCardDeck,
  deleteFlashCardDeck,
};