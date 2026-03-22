import React, { useState, useRef, useEffect } from "react";
import { BsRobot } from "react-icons/bs";
import { IoClose, IoSend } from "react-icons/io5";

export default function SubjectAIChat({ subjectName = "this subject" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Hi there! 👋 I'm your AI assistant for **${subjectName}**. Ask me anything about the course materials, past papers, or notes!`,
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated AI response (frontend only)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Thanks for your question! 🤖 The AI backend isn't connected yet, but once it is, I'll be able to answer questions based on all the uploaded materials for this subject.",
        },
      ]);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
          title="Ask AI about this subject"
        >
          <BsRobot className="text-2xl group-hover:animate-bounce" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-primary-400 opacity-30 animate-ping" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-[fadeInUp_0.25s_ease-out]">
          {/* Header */}
          <div className="bg-gradient-to-r from-secondary-600 to-secondary-800 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center">
                <BsRobot className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
                <p className="text-gray-300 text-xs truncate max-w-[200px]">{subjectName}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white transition p-1 rounded-full hover:bg-white/10"
            >
              <IoClose size={22} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary-500 text-primary-900 rounded-br-md"
                      : "bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-gray-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full bg-primary-500 text-primary-900 flex items-center justify-center hover:bg-primary-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IoSend size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Animation keyframe */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
