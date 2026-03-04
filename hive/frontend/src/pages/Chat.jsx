import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const SERVER_URL = "http://localhost:3003";

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [batch, setBatch] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const newSocket = io(SERVER_URL);

    newSocket.on("receiveMessage", (data) => {

      if (!data.system) data.system = false;
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on("pastMessages", (pastMsgs) => {

      const processed = pastMsgs.map((m) => ({
        ...m,
        system: m.username === "System" ? true : false,
      }));
      setMessages(processed);
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const getBatchFromId = (id) => id.split("/")[1];

  const joinRoom = () => {
    if (!studentId.trim()) return;
    const detectedBatch = getBatchFromId(studentId.trim());
    setBatch(detectedBatch);

    socket.emit("joinGroup", {
      room: detectedBatch,
      username: studentId.trim(),
    });
    setJoined(true);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      room: batch,
      username: studentId,
      message,
    });
    setMessage("");
  };

  const leaveRoom = () => {
    if (!socket) return;

    socket.emit("leaveGroup"); 
    setJoined(false);
    setBatch("");
  };


  useEffect(() => {
    const handleBeforeUnload = () => {
      if (joined && socket) socket.emit("leaveGroup");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [joined, socket]);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 font-sans">
      <h2 className="text-2xl font-bold text-center mb-6">Batch Group Chat</h2>

      {!joined ? (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter Student ID (SE/2022/013)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="p-3 border rounded-lg"
          />
          <button
            onClick={joinRoom}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
          >
            Join Your Batch
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between text-sm text-gray-600">
            <div>
              Batch: <b>{batch}</b> | Student: <b>{studentId}</b>
            </div>
            <button
              onClick={leaveRoom}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Leave
            </button>
          </div>

        
          <div className="border rounded-lg h-96 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 ${
                  msg.system
                    ? "text-center text-gray-400 italic"
                    : msg.username === studentId
                    ? "text-right"
                    : "text-left"
                }`}
              >
                {msg.system ? (
                  <span>{msg.message}</span>
                ) : (
                  <>
                    <span
                      className={`font-semibold ${
                        msg.username === studentId ? "text-blue-600" : "text-gray-800"
                      }`}
                    >
                      {msg.username === studentId ? "You" : msg.username}:
                    </span>{" "}
                    {msg.message}
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Type message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border p-3 rounded-lg"
            />
            <button className="bg-blue-600 text-white px-6 rounded-lg">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}