import { useState, useRef, useEffect } from "react";
import { FaSearch, FaPaperPlane, FaEllipsisV } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import { HiDocumentText } from "react-icons/hi";
import { RiVoiceprintLine } from "react-icons/ri";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "@/context/AuthContext";
import { getNotes, createNote, deleteNote, updateNote } from "@/services";

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

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "color", "background"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "blockquote",
    "code-block",
    "link",
    "color",
    "background",
  ];

  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const getAutoTopic = (content = "") =>
    content.trim().split(/\s+/).slice(0, 4).join(" ");

  const filteredNotes = notes.filter((note) =>
    (note.title || note.content)
      .toLowerCase()
      .includes(searchText.toLowerCase()),
  );

  // Fetch notes when user loads
  useEffect(() => {
    if (!loading && user && token) fetchNotesData();
  }, [loading, user, token]);

  useEffect(() => {
    if (!selectedNote) return;
    setEditText(selectedNote.content || "");
    setEditTopic(selectedNote.title || getAutoTopic(selectedNote.content));
  }, [selectedNote]);

  const fetchNotesData = async () => {
    try {
      const res = await getNotes();
      setNotes(res);
      if (res.length > 0) {
        setSelectedNote(res[0]);
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

  const openEditNote = (note) => {
    setSelectedNote(note);
    setEditTopic(note.title || getAutoTopic(note.content));
    setEditText(note.content || "");
    setIsCreatingNew(false);
    setIsEditMode(true);
  };

  const startCreateNew = () => {
    setSelectedNote(null);
    setIsEditMode(false);
    setIsCreatingNew(true);
    setNewTopic("");
    setText("");
  };

  const cancelCreate = () => {
    setIsCreatingNew(false);
    setNewTopic("");
    setText("");
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  // Start voice recognition
  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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

  // Create note from voice/text - using dynamic API from @/services
  const saveNewNote = async () => {
    if (!text.trim()) return;
    try {
      const payload = { content: text, isVoiceNote: false };
      if (newTopic.trim()) payload.title = newTopic.trim();

      console.log("Creating note with:", payload);
      const res = await createNote(payload);
      console.log("Note created successfully:", res);
      setNotes([...notes, res]);
      setSelectedNote(res);
      setText("");
      setNewTopic("");
      setIsCreatingNew(false);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      const status = err.response?.status;
      console.error("Error creating note:", err.response?.data || err.message);
      alert(
        backendMessage ||
          `Failed to create note${status ? ` (HTTP ${status})` : ""}`,
      );
    }
  };

  const handleUpdateNote = async (id, payload) => {
    try {
      const res = await updateNote(id, payload);
      setNotes(notes.map((n) => (n._id === id ? res : n)));
      setSelectedNote(res);
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
      await handleUpdateNote(selectedNote._id, payload);
    }

    setIsEditMode(false);
    setSelectedNote(null);
  };

  const cancelEdit = () => {
    if (!selectedNote) return;
    setEditText(selectedNote.content || "");
    setEditTopic(selectedNote.title || getAutoTopic(selectedNote.content));
    setIsEditMode(false);
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteNote(id);
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

    try {
      await handleUpdateNote(note._id, { title: newTitle.trim() });
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
    <div className="h-screen bg-primary p-6 overflow-y-auto">
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-semibold text-gray-700 text-3xl">My Notes</h1>
          <FaSearch
            className="text-gray-600 cursor-pointer text-2xl"
            onClick={() => setShowSearch(true)}
          />
        </div>

        <button
          onClick={startCreateNew}
          className="w-full mb-4 px-4 py-3 rounded text-3xl font-semibold transition hover:opacity-80"
          style={{ backgroundColor: "#FFF4CC", color: "#4D3D00" }}
        >
          + Create New Note
        </button>

        <hr className="mb-4" />

        <div className="space-y-2">
          {filteredNotes.map((note) => (
            <div key={note._id} className="relative group">
              <div
                className="flex items-center justify-between text-gray-700 p-3 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  openEditNote(note);
                  setShowMenuId(null);
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <HiDocumentText className="text-gray-600 text-lg shrink-0" />
                  <span className="text-3xl truncate">
                    {note.title ||
                      stripHtml(note.content).split(" ").slice(0, 4).join(" ")}
                  </span>
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
                      openEditNote(note);
                    }}
                  >
                    Edit
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
                      handleDeleteNote(note._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <p className="text-gray-500">
              No notes yet. Click Create New Note.
            </p>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[350px] p-4 border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-700 text-sm">
                Search Notes
              </h2>
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
                        openEditNote(note);
                        setShowSearch(false);
                        setSearchText("");
                      }}
                    >
                      {note.title ||
                        stripHtml(note.content).split(" ").slice(0, 4).join(" ")}
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

      {isCreatingNew && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border w-full max-w-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Create New Note
              </h2>
              <button
                onClick={cancelCreate}
                className="text-gray-500 hover:text-gray-700"
              >
                <AiOutlineClose />
              </button>
            </div>

            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Topic (optional)"
              className="w-full mb-3 rounded-xl border border-gray-300 px-4 py-2"
            />

            <div className="flex items-start w-full gap-3">
              <div className="flex-1 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm quill-container">
                <ReactQuill
                  theme="snow"
                  value={text}
                  onChange={setText}
                  modules={modules}
                  formats={formats}
                  placeholder="Type or use voice to create a note..."
                  className="h-64 sm:h-80"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {isListening ? (
                  <button
                    onClick={stopVoice}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition shadow-lg animate-pulse"
                  >
                    <AiOutlineClose className="text-white text-xl" />
                  </button>
                ) : (
                  <button
                    onClick={startVoice}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-900 transition shadow-lg"
                  >
                    <RiVoiceprintLine className="text-yellow-400 text-xl" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={cancelCreate}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveNewNote}
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
          </div>
        </div>
      )}

      {isEditMode && selectedNote && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border w-full max-w-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Edit Note</h2>
              <button
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <AiOutlineClose />
              </button>
            </div>

            <label className="block text-sm text-gray-600 mb-1">Topic</label>
            <input
              type="text"
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
              className="w-full mb-3 rounded-xl border border-gray-300 px-4 py-2 font-semibold"
            />

            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm quill-container">
              <ReactQuill
                theme="snow"
                value={editText}
                onChange={setEditText}
                modules={modules}
                formats={formats}
                className="h-80 sm:h-96"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
