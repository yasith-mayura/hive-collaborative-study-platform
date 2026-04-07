import React, { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import Card from "@/components/ui/Card";
import Notification from "@/components/ui/Notification";
import { useAuth } from "@/context/AuthContext";
import { getBatchChatHistory, getMyProfile } from "@/services";

const CHAT_SERVER_URL = import.meta.env.VITE_CHAT_SERVICE_URL || "http://localhost:3003";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ConnectionBadge = ({ state }) => {
  const map = {
    connecting: { label: "Connecting", className: "bg-amber-100 text-amber-700" },
    connected: { label: "Connected", className: "bg-emerald-100 text-emerald-700" },
    reconnecting: { label: "Reconnecting", className: "bg-orange-100 text-orange-700" },
    error: { label: "Connection Error", className: "bg-red-100 text-red-700" },
  };

  const config = map[state] || map.connecting;

  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap justify-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
};

export default function Chat() {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [connectionState, setConnectionState] = useState("connecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  const [batch, setBatch] = useState("");
  const [groupName, setGroupName] = useState("Batch Group Chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const myUid = useMemo(() => user?.uid || "", [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      setConnectionState("connecting");
      setInitialLoading(true);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Missing auth token. Please login again.");
        }

        const profile = await getMyProfile();
        if (!isMounted) return;

        const batchValue = String(profile?.batch || "").trim();
        if (!batchValue) {
          throw new Error("Your batch is not configured in profile.");
        }

        setBatch(batchValue);
        setGroupName(`Batch ${batchValue} Group Chat`);

        try {
          const historyResponse = await getBatchChatHistory(batchValue);
          if (isMounted) {
            setMessages(historyResponse?.messages || []);
          }
        } catch (historyError) {
          // Socket history will still hydrate messages after connect.
        }

        const socket = io(CHAT_SERVER_URL, {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 20,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          if (!isMounted) return;
          setConnectionState("connected");
          setErrorMessage("");
        });

        socket.on("chat:ready", (payload) => {
          if (!isMounted) return;
          const payloadBatch = String(payload?.batch || batchValue);
          setBatch(payloadBatch);
          setGroupName(payload?.groupName || `Batch ${payloadBatch} Group Chat`);
        });

        socket.on("chat:history", (payload) => {
          if (!isMounted) return;
          setMessages(payload?.messages || []);
        });

        socket.on("chat:message", (payload) => {
          if (!isMounted) return;
          setMessages((prev) => [...prev, payload]);
        });

        socket.on("chat:error", (payload) => {
          if (!isMounted) return;
          const message = payload?.message || "Chat service error";
          setErrorMessage(message);
          Notification.error(message);
        });

        socket.on("disconnect", (reason) => {
          if (!isMounted) return;
          if (reason !== "io client disconnect") {
            setConnectionState("reconnecting");
          }
        });

        socket.on("connect_error", (err) => {
          if (!isMounted) return;
          setConnectionState("error");
          setErrorMessage(err?.message || "Unable to connect to chat service");
        });

        socket.io.on("reconnect_attempt", () => {
          if (!isMounted) return;
          setConnectionState("reconnecting");
        });

        socket.io.on("reconnect", () => {
          if (!isMounted) return;
          setConnectionState("connected");
          setErrorMessage("");
        });
      } catch (err) {
        if (!isMounted) return;
        setConnectionState("error");
        setErrorMessage(err?.message || "Failed to initialize chat");
        Notification.error(err?.message || "Failed to initialize chat");
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const content = input.trim();

    if (!content || !socketRef.current || connectionState !== "connected") {
      return;
    }

    socketRef.current.emit("chat:send", { content });
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-110px)]">
      <Card className="h-full" bodyClass="p-0 h-full flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{groupName}</h1>
            <p className="text-xs text-slate-500">Real-time collaborative group chat for your batch</p>
          </div>
          <ConnectionBadge state={connectionState} />
        </div>

        {errorMessage && (
          <div className="mx-5 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {initialLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No messages yet for Batch {batch}. Start the conversation.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.senderId === myUid;

                return (
                  <div key={msg._id || `${msg.senderId}-${msg.timestamp}-${msg.content}`} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isOwn
                          ? "rounded-br-none bg-[#FFF4CC] text-[#4D3D00]"
                          : "rounded-bl-none border border-slate-200 bg-slate-50 text-slate-900"
                        }`}
                    >
                      <div className={`mb-1 text-xs font-semibold ${isOwn ? "text-[#4D3D00]/90" : "text-slate-600"}`}>
                        {msg.senderName} {msg.senderStudentNumber ? `(${msg.senderStudentNumber})` : ""}
                      </div>
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                      <div className={`mt-2 text-[11px] ${isOwn ? "text-[#4D3D00]/80" : "text-slate-500"}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="form-control"
              placeholder={connectionState === "connected" ? "Type a message..." : "Connecting to chat..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={connectionState !== "connected"}
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={connectionState !== "connected" || !input.trim()}
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Press Enter to send</p>
        </form>
      </Card>
    </div>
  );
}
