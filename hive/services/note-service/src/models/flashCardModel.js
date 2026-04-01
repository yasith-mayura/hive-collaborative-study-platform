const mongoose = require("mongoose");

const flashCardItemSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const flashCardSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cards: {
      type: [flashCardItemSchema],
      required: true,
      validate: {
        validator: (cards) => Array.isArray(cards) && cards.length > 0,
        message: "At least one flashcard is required",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FlashCardDeck", flashCardSchema);