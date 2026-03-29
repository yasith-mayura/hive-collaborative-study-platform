import { useState, useRef, useEffect, useMemo } from "react";
import { FaSearch, FaPaperPlane, FaEllipsisV } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import { HiDocumentText } from "react-icons/hi";
import { RiVoiceprintLine } from "react-icons/ri";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

export default function NotesPage() {
  const { user, token, loading } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editText, setEditText] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [showMenuId, setShowMenuId] = useState(null);
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  const getAutoTopic = (content = "") =>
    content
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(" ");

  const filteredNotes = notes.filter((note) =>
    (note.title || note.content)
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const api = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: "http://localhost:3004/api/notes",
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  // Fetch notes when user loads
  useEffect(() => {
    if (!loading && user && api) fetchNotes();
  }, [loading, user, api]);

  useEffect(() => {
    if (!selectedNote) return;
    setEditText(selectedNote.content || "");
    setEditTopic(selectedNote.title || getAutoTopic(selectedNote.content));
  }, [selectedNote]);

  const fetchNotes = async () => {
    if (!api) {
      console.error("API not initialized");
      return;
    }
    try {
      const res = await api.get("/");
      setNotes(res.data);
      if (res.data.length > 0) {
        setSelectedNote(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  const selectNote = (note) => {
    setSelectedNote(note);
    setIsEditMode(false);
    setIsCreatingNew(false);
  };

  const startCreateNew = () => {
    setSelectedNote(null);
    setIsEditMode(false);
    setIsCreatingNew(true);
    setNewTopic("");
    setText("");
  };

  // Start voice recognition
const startVoice = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("Voice recognition not supported");

  setIsListening(true);

  recognitionRef.current = new SpeechRecognition();
  recognitionRef.current.continuous = true;
  recognitionRef.current.interimResults = true;
  recognitionRef.current.lang = "en-US";

  let finalTranscript = text; // start with current text

  recognitionRef.current.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " "; // append only final
      } else {
        interimTranscript += transcript;
      }
    }
    setText(finalTranscript + interimTranscript); // show both final + interim
  };

  recognitionRef.current.onerror = (err) => console.error(err);

  recognitionRef.current.onend = () => {
    if (isListening) recognitionRef.current.start(); // auto-restart
  };

  recognitionRef.current.start();
};
  const stopVoice = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  // Create note from voice/text
  const createNote = async () => {
    if (!text.trim()) return;
    if (!api) {
      console.error("API not initialized - token may be missing");
      alert("Authentication error. Please refresh the page.");
      return;
    }
    try {
      const payload = { content: text, isVoiceNote: false };
      if (newTopic.trim()) payload.title = newTopic.trim();

      console.log("Creating note with:", payload);
      const res = await api.post("/create", payload);
      console.log("Note created successfully:", res.data);
      setNotes([...notes, res.data]);
      setSelectedNote(res.data);
      setText("");
      setNewTopic("");
      setIsCreatingNew(false);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      const status = err.response?.status;
      console.error("Error creating note:", err.response?.data || err.message);
      alert(backendMessage || `Failed to create note${status ? ` (HTTP ${status})` : ""}`);
    }
  };

  const updateNote = async (id, payload) => {
    if (!api) {
      console.error("API not initialized");
      return;
    }
    try {
      const res = await api.put(`/update/${id}`, payload);
      setNotes(notes.map((n) => (n._id === id ? res.data : n)));
      setSelectedNote(res.data);
    } catch (err) {
      console.error("Error updating note:", err);
    }
  };

  const saveCurrentNote = async () => {
    if (!selectedNote) return;
    const trimmedTopic = editTopic.trim();
    const payload = {};

    if (trimmedTopic && trimmedTopic !== (selectedNote.title || "")) {
      payload.title = trimmedTopic;
    }

    if (editText !== (selectedNote.content || "")) {
      payload.content = editText;
    }

    if (Object.keys(payload).length > 0) {
      await updateNote(selectedNote._id, payload);
    }

    setIsEditMode(false);
  };

  const cancelEdit = () => {
    if (!selectedNote) return;
    setEditText(selectedNote.content || "");
    setEditTopic(selectedNote.title || getAutoTopic(selectedNote.content));
    setIsEditMode(false);
  };

  const deleteNote = async (id) => {
    if (!api) {
      console.error("API not initialized");
      return;
    }
    try {
      await api.delete(`/delete/${id}`);
      const filtered = notes.filter((n) => n._id !== id);
      setNotes(filtered);
      if (selectedNote?._id === id) setSelectedNote(filtered[0] || null);
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

const renameNote = async (note) => {
  const newTitle = prompt("Enter new title", note.title || "");
  if (!newTitle) return;
  
  if (!api) {
    console.error("API not initialized");
    return;
  }

  try {
    await updateNote(note._id, { title: newTitle.trim() });
  } catch (err) {
    console.error("Error renaming note:", err);
  }
};
useEffect(() => {
  const handleClickOutside = () => {
    setShowMenuId(null);
  };

  window.addEventListener("click", handleClickOutside);

  return () => {
    window.removeEventListener("click", handleClickOutside);
  };
}, []);
  return (
    <div className="flex h-screen bg-primary">
      {/* Sidebar */}
      <div className="w-65 border-r border-gray-300 p-5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-semibold text-gray-700 text-lg">My Notes</h1>
          {/* <FaSearch className="text-gray-600 cursor-pointer" /> */}
          <FaSearch
  className="text-gray-600 cursor-pointer"
  onClick={() => setShowSearch(true)}
/>
        </div>

        <button
          onClick={startCreateNew}
          className="w-full mb-4 px-3 py-2 rounded bg-primary-500 text-white hover:bg-primary-700 transition"
        >
          + Create New Note
        </button>

        <hr className="mb-4" />

        <div className="space-y-4">
          {/* {notes.map((note) => ( */}
          {filteredNotes.map((note) => (
            <div key={note._id} className="relative group">
              <div
                className={`flex items-center justify-between text-gray-700 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  selectedNote?._id === note._id ? "bg-gray-200" : ""
                }`}
        onClick={() => {
    selectNote(note);
    setShowMenuId(null);
  }}
              >
                {showSearch && (
  <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
    <div className="bg-white rounded-lg shadow-lg w-[350px] p-4 border">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-gray-700 text-sm">Search Notes</h2>
        <button
          onClick={() => setShowSearch(false)}
          className="text-gray-600 hover:text-gray-800"
        >
          <AiOutlineClose />
        </button>
      </div>

      <input
        type="text"
        placeholder="Type to search..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full px-3 py-2 border rounded outline-none"
        autoFocus
      />

      {searchText && (
        <div className="mt-2 max-h-40 overflow-y-auto">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div
                key={note._id}
                className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm"
                onClick={() => {
                  selectNote(note);
                  setShowSearch(false);
                  setSearchText(""); 
                }}
              >
                {note.title || note.content.split(" ").slice(0, 3).join(" ")}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No results found</p>
          )}
        </div>
      )}
    </div>
  </div>
)}
                <div className="flex items-center gap-3">
                  <HiDocumentText className="text-gray-600 text-lg" />
      <span className="text-sm truncate">{note.title || note.content.split(" ").slice(0, 3).join(" ")}</span>

                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuId(showMenuId === note._id ? null : note._id);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaEllipsisV />
                </button>
              </div>

              {showMenuId === note._id && (
                <div className="absolute right-0 top-0 bg-white shadow-md rounded border z-10 flex flex-col">
                  <button
                    className="px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      setShowMenuId(null);
                      selectNote(note);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      setShowMenuId(null);
                      renameNote(note);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="px-4 py-2 text-left hover:bg-gray-100 text-red-500"
                    onClick={() => {
                      setShowMenuId(null);
                      deleteNote(note._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 relative flex flex-col p-6">

        {selectedNote ? (
          <>
          <div className="flex justify-end gap-2 mb-2">
            {!isEditMode ? (
              <button
                className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-700"
                onClick={() => setIsEditMode(true)}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={saveCurrentNote}
                >
                  Save
                </button>
              </>
            )}
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Topic</label>
            <input
              type="text"
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
              readOnly={!isEditMode}
              className={`w-full text-2xl font-semibold border border-gray-300 rounded px-3 py-2 ${
                isEditMode ? "bg-white" : "bg-gray-50"
              }`}
            />
          </div>
          <textarea
            className="w-full flex-1 p-4 text-gray-900 bg-white rounded-md  resize-none overflow-auto"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            readOnly={!isEditMode}
            style={{ minHeight: "6rem", maxHeight: "70vh" }}
          />
          </>
        ) : isCreatingNew ? (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Note</h2>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Topic (optional)"
              className="w-full mb-3 rounded-xl border border-gray-300 px-4 py-2"
            />

            <div className="flex items-center w-full">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or use voice to create a note..."
                className="w-full pt-2 rounded-4xl border border-gray-400 px-6 bg-transparent overflow-auto"
                style={{
                  minHeight: "8rem",
                  maxHeight: "100rem",
                  resize: "vertical",
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
              />

              {isListening ? (
                <button
                  onClick={stopVoice}
                  className="ml-4 w-12 h-12 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 transition"
                >
                  <AiOutlineClose />
                </button>
              ) : text.trim().length > 0 ? (
                <button
                  onClick={createNote}
                  className="ml-4 w-12 h-12 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-700 transition"
                >
                  <FaPaperPlane className="text-white text-lg" />
                </button>
              ) : (
                <button
                  onClick={startVoice}
                  className="ml-4 w-12 h-12 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-900 transition"
                >
                  <RiVoiceprintLine className="text-yellow-400 text-lg" />
                </button>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={createNote}
                disabled={!text.trim()}
                className={`px-4 py-2 rounded font-medium transition ${
                  text.trim()
                    ? "bg-primary-500 text-white hover:bg-primary-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Create Note
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Select a note from My Notes, or click Create New Note.</p>
        )}
      </div>
    </div>
  );
}