const express = require("express");
const {
  getNotes,
  createNote,
  deleteNote,
  updateNote,
  getFlashCardDecks,
  createFlashCardDeck,
  updateFlashCardDeck,
  deleteFlashCardDeck,
} = require("../controllers/noteController"); 
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Note routes
router.get('/', authMiddleware, getNotes);
router.post('/create', authMiddleware, createNote);
router.delete('/delete/:id', authMiddleware, deleteNote);
router.put('/update/:id', authMiddleware, updateNote);

// Flashcard routes
router.get('/flashcards', authMiddleware, getFlashCardDecks);
router.post('/flashcards', authMiddleware, createFlashCardDeck);
router.put('/flashcards/:id', authMiddleware, updateFlashCardDeck);
router.delete('/flashcards/:id', authMiddleware, deleteFlashCardDeck);

module.exports = router;