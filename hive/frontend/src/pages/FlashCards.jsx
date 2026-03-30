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
  const [showMobileDecks, setShowMobileDecks] = useState(false);
  // Track right/wrong marks: { [deckId]: { [cardIndex]: 'correct' | 'incorrect' } }
  const [cardMarks, setCardMarks] = useState({});

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
    if (showMobileDecks) setShowMobileDecks(false);
  };

  // Mark a card as correct or incorrect
  const handleMarkCard = (e, mark) => {
    e.stopPropagation();
    if (!selectedDeck) return;
    setCardMarks((prev) => ({
      ...prev,
      [selectedDeckId]: {
        ...(prev[selectedDeckId] || {}),
        [currentCardIndex]: mark,
      },
    }));
    // Auto-advance to next card after a short delay
    setTimeout(() => {
      if (currentCardIndex < selectedDeck.cards.length - 1) {
        setCurrentCardIndex((i) => i + 1);
        setIsFlipped(false);
      } else {
        setIsFlipped(false);
      }
    }, 400);
  };

  const handleResetMarks = () => {
    setCardMarks((prev) => ({ ...prev, [selectedDeckId]: {} }));
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // Get marks for current deck
  const currentDeckMarks = cardMarks[selectedDeckId] || {};
  const totalMarked = Object.keys(currentDeckMarks).length;
  const correctCount = Object.values(currentDeckMarks).filter((m) => m === "correct").length;
  const incorrectCount = Object.values(currentDeckMarks).filter((m) => m === "incorrect").length;

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
    setNewCards([{ question: "", answer: "" }]);
  };

  const handleStartCreating = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingDeckId(null);
    setNewDeckName("");
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
    if (showMobileDecks) setShowMobileDecks(false);
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
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-120px)] -mx-4 md:-mx-6 -mt-4 md:-mt-6 relative overflow-hidden">
      {/* Mobile Backdrop for Deck Drawer */}
      {showMobileDecks && (
        <div 
          className="fixed inset-0 bg-black/40 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setShowMobileDecks(false)}
        />
      )}

      {/* Sidebar — My Cards (Hidden on mobile, drawer on mobile) */}
      <div className={`
        fixed inset-y-0 left-0 z-[70] w-[280px] bg-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0 lg:w-[260px] lg:min-w-[260px] lg:border-r border-gray-200 flex flex-col
        ${showMobileDecks ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        {/* Mobile close button */}
        <button 
          onClick={() => setShowMobileDecks(false)}
          className="absolute top-4 right-4 lg:hidden text-secondary-400 p-2 hover:bg-gray-100 rounded-full"
        >
          <Icon icon="heroicons-outline:x-mark" className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
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
          <div className="px-6 pb-2">
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
        <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-6 mt-1">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              onClick={() => handleSelectDeck(deck.id)}
              className={`group w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition text-sm cursor-pointer ${selectedDeckId === deck.id && !isCreating
                ? "bg-primary-100 text-secondary-900 font-medium shadow-sm"
                : "text-secondary-600 hover:bg-gray-50 border border-transparent hover:border-gray-100"
                }`}
            >
              <Icon
                icon="heroicons-outline:rectangle-stack"
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
          {filteredDecks.length === 0 && (
            <p className="text-center text-xs text-secondary-400 mt-10 italic">No decks found</p>
          )}
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
      <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-y-auto">
        {/* Mobile Header / Decks Trigger */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
          <button 
            onClick={() => setShowMobileDecks(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-900 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform"
          >
            <Icon icon="heroicons-outline:rectangle-stack" className="w-4 h-4" />
            My Decks
          </button>
          {selectedDeck && (
            <span className="text-xs font-semibold text-secondary-600 truncate max-w-[150px]">
              {selectedDeck.name}
            </span>
          )}
          <button
            onClick={handleStartCreating}
            className="p-1.5 bg-secondary-800 text-white rounded-lg shadow-md"
          >
            <Icon icon="heroicons-outline:plus" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
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
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {newCards.map((card, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-stretch gap-0 bg-white border border-primary-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="flex-1 flex flex-col sm:flex-row">
                    {/* Question */}
                    <div className="flex-1 px-4 py-4 border-b sm:border-b-0 sm:border-r border-primary-100">
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
                    <div className="flex-1 px-4 py-4">
                      <label className="text-xs font-semibold text-secondary-500 mb-1 block">
                        Answer {index + 1}
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Enter answer..."
                        value={card.answer}
                        onChange={(e) =>
                          handleCardInputChange(
                            index,
                            "answer",
                            e.target.value
                          )
                        }
                        className="w-full bg-transparent outline-none text-sm text-secondary-800 placeholder:text-secondary-300 border-b border-dotted border-secondary-200 focus:border-primary-400 transition-colors py-1 resize-none"
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
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setEditingDeckId(null);
                }}
                className="w-full sm:w-auto px-6 py-2.5 border border-secondary-300 text-secondary-600 text-sm font-medium rounded-xl hover:bg-secondary-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  !newDeckName.trim() ||
                  !newCards.some((c) => c.question.trim() && c.answer.trim())
                }
                className="w-full sm:w-auto px-8 py-2.5 bg-secondary-800 text-white text-sm font-medium rounded-xl hover:bg-secondary-900 transition disabled:opacity-40 shadow-lg shadow-secondary-200"
              >
                {isEditing ? "Save Deck" : "Create Deck"}
              </button>
            </div>
          </div>
        ) : currentCard ? (
          /* ===== VIEWER MODE ===== */
          <div className="flex flex-col items-center gap-6 w-full max-w-2xl px-2">
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-secondary-400 uppercase tracking-widest">
                  Card {currentCardIndex + 1} of {selectedDeck.cards.length}
                </span>
                {/* Card mark indicator dots */}
                {selectedDeck.cards.length > 0 && (
                  <div className="flex items-center gap-1">
                    {selectedDeck.cards.map((_, i) => {
                      const mark = currentDeckMarks[i];
                      return (
                        <button
                          key={i}
                          onClick={() => { setCurrentCardIndex(i); setIsFlipped(false); }}
                          className={`w-2.5 h-2.5 rounded-full transition-all border ${
                            i === currentCardIndex ? "scale-125 ring-2 ring-offset-1" : ""
                          } ${
                            mark === "correct"
                              ? "bg-green-500 border-green-600 ring-green-300"
                              : mark === "incorrect"
                              ? "bg-red-500 border-red-600 ring-red-300"
                              : "bg-gray-200 border-gray-300 ring-gray-200"
                          }`}
                          title={`Card ${i + 1}${mark ? ` — ${mark}` : ""}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalMarked > 0 && (
                  <button
                    onClick={handleResetMarks}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-secondary-500 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition active:scale-95"
                    title="Reset all marks"
                  >
                    <Icon icon="heroicons-outline:arrow-path" className="w-3 h-3" />
                    RESET
                  </button>
                )}
                <button
                  onClick={handleQuickAddCard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition active:scale-95"
                >
                  <Icon icon="heroicons-outline:plus" className="w-3 h-3" />
                  ADD NEW CARD
                </button>
              </div>
            </div>

            {/* Score Summary Bar */}
            {totalMarked > 0 && (
              <div className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-green-600">
                  <Icon icon="heroicons-outline:check-circle" className="w-4 h-4" />
                  <span className="text-xs font-bold">{correctCount}</span>
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-green-500 h-full transition-all duration-500"
                      style={{ width: selectedDeck ? `${(correctCount / selectedDeck.cards.length) * 100}%` : "0%" }}
                    />
                    <div
                      className="bg-red-400 h-full transition-all duration-500"
                      style={{ width: selectedDeck ? `${(incorrectCount / selectedDeck.cards.length) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-red-500">
                  <span className="text-xs font-bold">{incorrectCount}</span>
                  <Icon icon="heroicons-outline:x-circle" className="w-4 h-4" />
                </div>
              </div>
            )}

            <div className="relative w-full flex items-center gap-2 sm:gap-6 justify-center">
              {/* Prev arrow (Desktop Only) */}
              <button
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="hidden sm:block text-secondary-300 hover:text-secondary-600 transition disabled:opacity-20"
              >
                <Icon
                  icon="heroicons-outline:chevron-left"
                  className="w-10 h-10"
                />
              </button>

              {/* Flashcard */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full sm:w-[480px] aspect-[4/3] sm:aspect-auto sm:h-[280px] cursor-pointer [perspective:1000px] group overflow-visible"
              >
                <div
                  className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""
                    }`}
                >
                  {/* Visual card stack effect (background layers) */}
                  <div className="absolute inset-0 bg-white/40 translate-x-2 translate-y-2 rounded-2xl -z-10 border border-black/5" />
                  <div className="absolute inset-0 bg-white/60 translate-x-1 translate-y-1 rounded-2xl -z-10 border border-black/5" />

                  {/* Front — Question */}
                  <div
                    className="absolute inset-0 [backface-visibility:hidden] rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl transition-shadow group-hover:shadow-primary-200 border border-white/20"
                    style={{ 
                      background: `linear-gradient(135deg, ${getCardColor(currentCardIndex).front}, ${getCardColor(currentCardIndex).back})`,
                    }}
                  >
                    {/* Mark indicator badge */}
                    {currentDeckMarks[currentCardIndex] && (
                      <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center ${
                        currentDeckMarks[currentCardIndex] === "correct" ? "bg-green-500" : "bg-red-500"
                      }`}>
                        <Icon icon={currentDeckMarks[currentCardIndex] === "correct" ? "heroicons-outline:check" : "heroicons-outline:x-mark"} className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Question</span>
                      <p style={{ color: getCardColor(currentCardIndex).text }} className="text-base sm:text-xl font-medium leading-relaxed">
                        {currentCard.question}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <span style={{ color: getCardColor(currentCardIndex).accent }} className="text-[11px] font-bold flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-full pointer-events-none">
                        <Icon
                          icon="heroicons-outline:arrow-path"
                          className="w-4 h-4 animate-spin-slow"
                        />
                        FLIP TO REVEAL
                      </span>
                    </div>
                  </div>

                  {/* Back — Answer */}
                  <div
                    className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl transition-shadow border-[3px]"
                    style={{ 
                      backgroundColor: "#FFFFFF",
                      borderColor: getCardColor(currentCardIndex).front,
                    }}
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Answer</span>
                      <div className="overflow-y-auto max-h-[160px] pr-1 scrollbar-hide">
                        <p className="text-base sm:text-lg font-semibold text-secondary-800 leading-relaxed">
                          {currentCard.answer}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center rounded-b-xl overflow-hidden -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 mt-0">
                       <button
                         onClick={(e) => handleMarkCard(e, "correct")}
                         className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all ${
                           currentDeckMarks[currentCardIndex] === "correct"
                             ? "bg-green-500 text-white"
                             : "bg-green-50 text-green-700 hover:bg-green-100"
                         }`}
                       >
                         <Icon icon="heroicons-outline:check-circle" className="w-5 h-5" />
                         Got it!
                       </button>
                       <button
                         onClick={(e) => handleMarkCard(e, "incorrect")}
                         className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all ${
                           currentDeckMarks[currentCardIndex] === "incorrect"
                             ? "bg-red-500 text-white"
                             : "bg-red-50 text-red-700 hover:bg-red-100"
                         }`}
                       >
                         <Icon icon="heroicons-outline:x-circle" className="w-5 h-5" />
                         Review Again
                       </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next arrow (Desktop Only) */}
              <button
                onClick={handleNextCard}
                disabled={
                  !selectedDeck ||
                  currentCardIndex >= selectedDeck.cards.length - 1
                }
                className="hidden sm:block text-secondary-300 hover:text-secondary-600 transition disabled:opacity-20"
              >
                <Icon
                  icon="heroicons-outline:chevron-right"
                  className="w-10 h-10"
                />
              </button>
            </div>

            {/* Mobile Navigation Bar */}
            <div className="w-full flex sm:hidden items-center justify-between gap-4 mt-8 px-4 py-2 bg-white rounded-2xl shadow-lg border border-gray-100">
               <button
                  onClick={handlePrevCard}
                  disabled={currentCardIndex === 0}
                  className="flex-1 flex items-center justify-center py-3 text-secondary-600 disabled:opacity-20 active:scale-95 transition-transform"
                >
                  <Icon icon="heroicons-outline:arrow-left" className="w-6 h-6" />
                </button>
                <div className="w-[1px] h-8 bg-gray-100" />
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="flex-1 flex items-center justify-center py-3 text-primary-600 active:scale-95 transition-transform"
                >
                  <Icon icon="heroicons-outline:arrow-path" className="w-6 h-6" />
                </button>
                <div className="w-[1px] h-8 bg-gray-100" />
                <button
                  onClick={handleNextCard}
                  disabled={!selectedDeck || currentCardIndex >= selectedDeck.cards.length - 1}
                  className="flex-1 flex items-center justify-center py-3 text-secondary-600 disabled:opacity-20 active:scale-95 transition-transform"
                >
                  <Icon icon="heroicons-outline:arrow-right" className="w-6 h-6" />
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
  </div>
  );
}
