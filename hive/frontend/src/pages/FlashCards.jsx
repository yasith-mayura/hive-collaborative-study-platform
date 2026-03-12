import React, { useState } from "react";
import Icon from "@/components/ui/Icon";

// Card color themes — assigned per card automatically
const CARD_COLORS = [
  { front: "#0F766E", back: "#115E59", text: "#FFFFFF", accent: "#5EEAD4" },
  { front: "#4338CA", back: "#3730A3", text: "#FFFFFF", accent: "#A5B4FC" },
  { front: "#BE123C", back: "#9F1239", text: "#FFFFFF", accent: "#FDA4AF" },
  { front: "#B45309", back: "#92400E", text: "#FFFFFF", accent: "#FCD34D" },
  { front: "#047857", back: "#065F46", text: "#FFFFFF", accent: "#6EE7B7" },
];

const getCardColor = (index) => CARD_COLORS[index % CARD_COLORS.length];

// Mock deck data
const initialDecks = [
  {
    id: 1,
    name: "Data Structures",
    cards: [
      {
        question: "What is a stack?",
        answer:
          "A stack is a linear data structure that follows the Last In First Out (LIFO) principle.",
      },
      {
        question: "What is a queue?",
        answer:
          "A queue is a linear data structure that follows the First In First Out (FIFO) principle.",
      },
      {
        question: "What is a linked list?",
        answer:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam?",
      },
    ],
  },
  {
    id: 2,
    name: "Data Structures",
    cards: [
      {
        question: "What is a binary tree?",
        answer:
          "A binary tree is a tree data structure where each node has at most two children.",
      },
    ],
  },
  {
    id: 3,
    name: "Data Structures",
    cards: [
      {
        question: "What is a graph?",
        answer:
          "A graph is a non-linear data structure consisting of vertices and edges.",
      },
    ],
  },
];

export default function FlashCards() {
  const [decks, setDecks] = useState(initialDecks);
  const [selectedDeckId, setSelectedDeckId] = useState(1);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Creation form state
  const [newDeckName, setNewDeckName] = useState("");
  const [newCards, setNewCards] = useState([{ question: "", answer: "" }]);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId);
  const currentCard = selectedDeck?.cards[currentCardIndex];

  const filteredDecks = decks.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrevCard = () => {
    if (selectedDeck && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (selectedDeck && currentCardIndex < selectedDeck.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleSelectDeck = (deckId) => {
    setSelectedDeckId(deckId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsCreating(false);
  };

  const handleAddCardRow = () => {
    setNewCards([...newCards, { question: "", answer: "" }]);
  };

  const handleRemoveCardRow = (index) => {
    if (newCards.length > 1) {
      setNewCards(newCards.filter((_, i) => i !== index));
    }
  };

  const handleCardInputChange = (index, field, value) => {
    const updated = [...newCards];
    updated[index][field] = value;
    setNewCards(updated);
  };

  const handleCreate = () => {
    const validCards = newCards.filter(
      (c) => c.question.trim() && c.answer.trim()
    );
    if (validCards.length === 0 || !newDeckName.trim()) return;

    if (isEditing && editingDeckId) {
      // Update existing deck
      setDecks(
        decks.map((d) =>
          d.id === editingDeckId
            ? { ...d, name: newDeckName.trim(), cards: validCards }
            : d
        )
      );
      setSelectedDeckId(editingDeckId);
      setCurrentCardIndex(0);
    } else {
      // Create new deck
      const newDeck = {
        id: Date.now(),
        name: newDeckName.trim(),
        cards: validCards,
      };
      setDecks([...decks, newDeck]);
      setSelectedDeckId(newDeck.id);
      setCurrentCardIndex(0);
    }
    setIsCreating(false);
    setIsEditing(false);
    setEditingDeckId(null);
    setNewDeckName("");
    setNewDeckColor("charcoal");
    setNewCards([{ question: "", answer: "" }]);
  };

  const handleStartCreating = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingDeckId(null);
    setNewDeckName("");
    setNewDeckColor("charcoal");
    setNewCards([{ question: "", answer: "" }]);
  };

  const handleEditDeck = (e, deckId) => {
    e.stopPropagation();
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return;
    setIsCreating(true);
    setIsEditing(true);
    setEditingDeckId(deckId);
    setNewDeckName(deck.name);
    setNewCards(deck.cards.map((c) => ({ ...c })));
  };

  const handleQuickAddCard = () => {
    if (!selectedDeck) return;
    setIsCreating(true);
    setIsEditing(true);
    setEditingDeckId(selectedDeck.id);
    setNewDeckName(selectedDeck.name);
    setNewCards([
      ...selectedDeck.cards.map((c) => ({ ...c })),
      { question: "", answer: "" },
    ]);
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-120px)] -mx-4 md:-mx-6 -mt-4 md:-mt-6">
      {/* Left Sidebar — My Cards */}
      <div className="w-[220px] min-w-[220px] border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="text-base font-semibold text-secondary-800">
            My Cards
          </h2>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-secondary-400 hover:text-secondary-600 transition"
          >
            <Icon
              icon="heroicons-outline:magnifying-glass"
              className="w-4 h-4"
            />
          </button>
        </div>

        {/* Search input */}
        {showSearch && (
          <div className="px-4 pb-2">
            <input
              type="text"
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400 transition"
            />
          </div>
        )}

        {/* Deck list */}
        <div className="flex-1 overflow-y-auto px-2">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              onClick={() => handleSelectDeck(deck.id)}
              className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition text-sm cursor-pointer ${selectedDeckId === deck.id && !isCreating
                ? "bg-primary-100 text-secondary-900 font-medium"
                : "text-secondary-600 hover:bg-gray-50"
                }`}
            >
              <Icon
                icon="heroicons-outline:clock"
                className="w-4 h-4 shrink-0 text-secondary-400"
              />
              <span className="truncate flex-1">{deck.name}</span>
              <button
                onClick={(e) => handleEditDeck(e, deck.id)}
                className="opacity-0 group-hover:opacity-100 text-secondary-400 hover:text-primary-600 transition"
                title="Edit deck"
              >
                <Icon
                  icon="heroicons-outline:pencil-square"
                  className="w-4 h-4"
                />
              </button>
            </div>
          ))}
        </div>

        {/* Add button */}
        <div className="p-4 flex justify-center">
          <button
            onClick={handleStartCreating}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary-700 text-white hover:bg-secondary-800 transition shadow-md"
          >
            <Icon icon="heroicons-outline:plus" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
        {isCreating ? (
          /* ===== CREATION MODE ===== */
          <div className="w-full max-w-3xl">
            {/* Deck name input */}
            <div className="mb-5">
              <input
                type="text"
                placeholder="Deck name (e.g. Data Structures)"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="w-full px-4 py-3 text-sm font-medium border border-gray-200 rounded-xl outline-none focus:border-primary-400 bg-white transition"
              />
            </div>

            {/* Card rows */}
            <div className="space-y-3">
              {newCards.map((card, index) => (
                <div
                  key={index}
                  className="flex items-center gap-0 bg-primary-50 border-2 border-primary-300 rounded-xl overflow-hidden"
                >
                  <div className="flex-1 flex">
                    {/* Question */}
                    <div className="flex-1 px-4 py-3 border-r border-primary-200">
                      <label className="text-xs font-semibold text-secondary-500 mb-1 block">
                        Question {index + 1}
                      </label>
                      <input
                        type="text"
                        placeholder="Enter question..."
                        value={card.question}
                        onChange={(e) =>
                          handleCardInputChange(
                            index,
                            "question",
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent outline-none text-sm text-secondary-800 placeholder:text-secondary-300 border-b border-secondary-200 pb-1"
                      />
                    </div>

                    {/* Answer */}
                    <div className="flex-1 px-4 py-3">
                      <label className="text-xs font-semibold text-secondary-500 mb-1 block">
                        Answer {index + 1}
                      </label>
                      <input
                        type="text"
                        placeholder="Enter answer..."
                        value={card.answer}
                        onChange={(e) =>
                          handleCardInputChange(
                            index,
                            "answer",
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent outline-none text-sm text-secondary-800 placeholder:text-secondary-300 border-b border-secondary-200 pb-1"
                      />
                    </div>
                  </div>

                  {/* Add / Remove row button */}
                  <button
                    onClick={
                      index === newCards.length - 1
                        ? handleAddCardRow
                        : () => handleRemoveCardRow(index)
                    }
                    className="px-3 self-stretch flex items-center text-secondary-400 hover:text-secondary-600 transition"
                  >
                    <Icon
                      icon={
                        index === newCards.length - 1
                          ? "heroicons-outline:plus-circle"
                          : "heroicons-outline:minus-circle"
                      }
                      className="w-5 h-5"
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Create / Save button */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setEditingDeckId(null);
                }}
                className="px-6 py-2.5 border border-secondary-300 text-secondary-600 text-sm font-medium rounded-lg hover:bg-secondary-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  !newDeckName.trim() ||
                  !newCards.some((c) => c.question.trim() && c.answer.trim())
                }
                className="px-8 py-2.5 bg-secondary-700 text-white text-sm font-medium rounded-lg hover:bg-secondary-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isEditing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        ) : currentCard ? (
          /* ===== VIEWER MODE ===== */
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              {/* Prev arrow */}
              <button
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="text-secondary-300 hover:text-secondary-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon
                  icon="heroicons-outline:chevron-left"
                  className="w-8 h-8"
                />
              </button>

              {/* Flashcard */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-[420px] h-[240px] cursor-pointer [perspective:1000px]"
              >
                <div
                  className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""
                    }`}
                >
                  {/* Front — Question */}
                  <div
                    className="absolute inset-0 [backface-visibility:hidden] rounded-2xl p-6 flex flex-col justify-between shadow-lg"
                    style={{ backgroundColor: getCardColor(currentCardIndex).front }}
                  >
                    <p style={{ color: getCardColor(currentCardIndex).text }} className="text-sm leading-relaxed">
                      {currentCard.question}
                    </p>
                    <div className="flex justify-end">
                      <span style={{ color: getCardColor(currentCardIndex).accent }} className="text-xs flex items-center gap-1">
                        <Icon
                          icon="heroicons-outline:arrow-path"
                          className="w-4 h-4"
                        />
                        Click to flip
                      </span>
                    </div>
                  </div>

                  {/* Back — Answer */}
                  <div
                    className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-6 flex flex-col justify-between shadow-lg"
                    style={{ backgroundColor: getCardColor(currentCardIndex).back, border: `1px solid ${getCardColor(currentCardIndex).accent}30` }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: "#E5E7EB" }}>
                      {currentCard.answer}
                    </p>
                    <div className="flex justify-between items-center">
                      <span style={{ color: getCardColor(currentCardIndex).accent }} className="text-xs">Answer</span>
                      <span style={{ color: getCardColor(currentCardIndex).accent }} className="text-xs flex items-center gap-1">
                        <Icon
                          icon="heroicons-outline:arrow-path"
                          className="w-4 h-4"
                        />
                        Click to flip
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next arrow */}
              <button
                onClick={handleNextCard}
                disabled={
                  !selectedDeck ||
                  currentCardIndex >= selectedDeck.cards.length - 1
                }
                className="text-secondary-300 hover:text-secondary-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon
                  icon="heroicons-outline:chevron-right"
                  className="w-8 h-8"
                />
              </button>
            </div>

            {/* Card counter + Add card button */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-secondary-400">
                {currentCardIndex + 1} / {selectedDeck.cards.length}
              </span>
              <button
                onClick={handleQuickAddCard}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-secondary-600 border border-secondary-200 rounded-lg hover:bg-primary-100 hover:border-primary-300 transition"
              >
                <Icon icon="heroicons-outline:plus" className="w-3.5 h-3.5" />
                Add Card
              </button>
            </div>
          </div>
        ) : (
          /* ===== EMPTY STATE ===== */
          <div className="text-center text-secondary-400">
            <Icon
              icon="heroicons-outline:rectangle-stack"
              className="w-12 h-12 mx-auto mb-3 opacity-40"
            />
            <p className="text-sm">
              Select a deck or create a new one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
