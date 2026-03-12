import { useState, useRef } from "react";
import { FaSearch, FaDownload, FaMicrophone, FaPaperPlane } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";
import { RiVoiceprintLine } from "react-icons/ri";

export default function NotesPage() {

  const [notes, setNotes] = useState([
    "Data Structures",
    "Data Structures",
    "Data Structures",
    "Data Structures"
  ]);

  const [text, setText] = useState("");
  const [showSend, setShowSend] = useState(false);

  const recognitionRef = useRef(null);

  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition not supported");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.start();

    recognitionRef.current.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setText(transcript);
    };

    recognitionRef.current.onend = () => {
      setShowSend(true); 
    };
  };

  const sendNote = () => {
    if (!text.trim()) return;

    setNotes([...notes, text]);
    setText("");
    setShowSend(false);
  };

  return (
    <div className="flex h-screen bg-primary">

      {/* Sidebar */}
      <div className="w-65 border-r border-gray-300 p-5">

        <div className="flex justify-between items-center mb-4">
          <h1 className="font-semibold text-gray-700 text-lg">
            My Notes
          </h1>
          <FaSearch className="text-gray-600 cursor-pointer" />
        </div>

        <hr className="mb-4" />

        <div className="space-y-6">

          {notes.map((note, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-gray-700"
            >
              <div className="flex items-center gap-3">
                <HiDocumentText className="text-gray-600 text-lg" />
                <span className="text-sm">{note}</span>
              </div>

              <FaDownload className="text-gray-600 cursor-pointer" />
            </div>
          ))}

        </div>

      </div>

      {/* Main area */}
      <div className="flex-1 relative">

        <div className="absolute bottom-28 w-full flex justify-center">

          <div className="flex items-center w-162.5 px-4">

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Voice to text ..."
              className="w-full h-12 rounded-full border border-gray-400 bg-transparent px-6 outline-none"
            />

            {!showSend && (
              <button
                onClick={startVoice}
                className="ml-4 w-12 h-12 flex items-center justify-center rounded-full bg-gray-800"
              >
                <RiVoiceprintLine className="text-yellow-400 text-lg" />
              </button>
            )}


            {showSend && (
              <button
                onClick={sendNote}
                className="ml-4 w-12 h-12 flex items-center justify-center rounded-full bg-green-600"
              >
                <FaPaperPlane className="text-white text-lg" />
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}