import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

const PRESETS = {
  focus: { minutes: 25, color: "#FFCC00", glow: "bg-primary-300", label: "Focus" },
  shortBreak: { minutes: 5, color: "#10B981", glow: "bg-green-300", label: "Short Break" },
  longBreak: { minutes: 15, color: "#3B82F6", glow: "bg-blue-300", label: "Long Break" }
};

const ALARM_SOUND = "https://actions.google.com/sounds/v1/emergency/beeper_emergency_call.ogg";

export default function PomodoroTimer() {
  const location = useLocation();
  const isDashboard = location.pathname === "/";
  const isFloating = !isDashboard;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [portalNode, setPortalNode] = useState(null);

  const [mode, setMode] = useState("focus");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const [duration, setDuration] = useState(PRESETS.focus.minutes * 60);
  const [timeLeft, setTimeLeft] = useState(PRESETS.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(String(PRESETS.focus.minutes));
  const intervalRef = useRef(null);
  const inputRef = useRef(null);

  // Attempt to find the dashboard slot for portaling when on the dashboard
  useEffect(() => {
    if (isDashboard) {
      setIsCollapsed(false); // never collapsed on dashboard
      const checkNode = () => {
        const node = document.getElementById("pomodoro-timer-slot");
        if (node) setPortalNode(node);
      };
      checkNode();
      const delay = setTimeout(checkNode, 200);
      return () => clearTimeout(delay);
    } else {
      setPortalNode(null);
    }
  }, [isDashboard]);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendBreakNotification = useCallback((finishedMode) => {
    let title = "🐝 Time's up!";
    let bodyText = finishedMode === "focus" ? "Great work! Time for a break to recharge." : "Break is over. Ready to focus again?";

    // Show globally via toast
    toast.success(`${title} ${bodyText}`, {
      position: "top-right",
      autoClose: 6000,
    });

    // Show native browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body: bodyText, icon: "/logo-collapsed.png" });
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);

            try {
              const audio = new Audio(ALARM_SOUND);
              audio.volume = 1;
              audio.play();
            } catch (e) { }

            setMode((currentMode) => {
              if (currentMode === "focus") {
                setSessionsCompleted((s) => s + 1);
              }
              sendBreakNotification(currentMode);
              return currentMode;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, sendBreakNotification]);

  const setPreset = (newMode) => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setMode(newMode);
    setDuration(PRESETS[newMode].minutes * 60);
    setTimeLeft(PRESETS[newMode].minutes * 60);
    setInputMinutes(String(PRESETS[newMode].minutes));
    setIsEditing(false);
  };

  const handleStart = () => {
    if (timeLeft === 0) setPreset(mode);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const handleReset = () => {
    setPreset(mode);
  };

  const handleTimeClick = () => {
    if (!isRunning && !isCollapsed) {
      setIsEditing(true);
      setInputMinutes(String(Math.ceil(duration / 60)));
      setTimeout(() => inputRef.current?.select(), 50);
    }
  };

  const handleInputConfirm = () => {
    const mins = Math.max(1, Math.min(120, parseInt(inputMinutes) || PRESETS[mode].minutes));
    const newDuration = mins * 60;
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setInputMinutes(String(mins));
    setIsEditing(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") handleInputConfirm();
    if (e.key === "Escape") setIsEditing(false);
  };

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? timeLeft / duration : 0;
  const strokeDashoffset = -circumference * (1 - progress);

  // Hide the floating timer if it's not running, not paused mid-session
  const isTimerIdle = !isRunning && (timeLeft === 0 || timeLeft === duration);
  if (isFloating && isTimerIdle) {
    return null;
  }

  // If we are collapsed (only possible when floating)
  if (isFloating && isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-6 right-6 z-[100] bg-white shadow-xl px-4 py-3 rounded-full border border-gray-200 flex items-center gap-2 hover:bg-gray-50 transition-all font-bold text-secondary-800 tracking-wider group animate-fade-in"
      >
        <span className="text-xl group-hover:scale-110 transition-transform">🐝</span>
        {minutes}:{seconds}
      </button>
    );
  }

  const timerContent = (
    <div className={`transition-all duration-300 bg-white ${isFloating ? 'fixed bottom-6 right-6 z-[100] shadow-2xl p-6 rounded-2xl w-[320px] border border-gray-100 animate-fade-in' : 'flex flex-col items-center relative w-full h-full'}`}>

      {/* Collapse button when floating */}
      {isFloating && (
        <button
          onClick={() => setIsCollapsed(true)}
          className="absolute top-4 right-4 text-secondary-600 bg-secondary-100 hover:bg-secondary-200 hover:text-secondary-900 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-20 shadow-sm"
          title="Minimize timer"
        >
          <Icon icon="heroicons-outline:minus" className="text-xl" />
        </button>
      )}
      {/* Mode selectors */}
      {!isFloating && (
        <div className={`flex gap-1 mb-6 bg-secondary-50 p-1 rounded-lg w-fit mx-auto`}>
          {Object.keys(PRESETS).map((presetKey) => (
            <button
              key={presetKey}
              onClick={() => setPreset(presetKey)}
              className={`px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition duration-200 ${mode === presetKey ? "bg-white text-secondary-900 shadow-sm" : "text-secondary-500 hover:text-secondary-700"
                }`}
            >
              {PRESETS[presetKey].label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center flex-1 justify-center relative">
        {/* Timer circle */}
        <div
          className={`relative w-[140px] h-[140px] flex items-center justify-center ${!isRunning ? "cursor-pointer hover:scale-105 transition-transform" : ""
            }`}
          onClick={handleTimeClick}
          title={!isRunning ? "Click to set time" : ""}
        >
          {/* Pulsing aura when running */}
          {isRunning && (
            <div className={`absolute w-full h-full rounded-full ${PRESETS[mode].glow} animate-pulse opacity-30 blur-xl scale-110 -z-10`}></div>
          )}

          <svg
            className="absolute top-0 left-0 w-full h-full -rotate-90"
            viewBox="0 0 120 120"
          >
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={timeLeft === 0 ? "#1E293B" : PRESETS[mode].color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
            />
          </svg>

          {/* Time display / edit */}
          <div className="flex items-center z-10">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="number"
                  min="1"
                  max="120"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(e.target.value)}
                  onBlur={handleInputConfirm}
                  onKeyDown={handleInputKeyDown}
                  className="w-12 text-center text-2xl font-bold text-secondary-800 bg-transparent border-b-2 border-primary-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-secondary-400">m</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-secondary-800 tracking-wider">
                {minutes}:{seconds}
              </span>
            )}
          </div>
        </div>

        {/* Streaks Tracker */}
        <div className="mt-3 h-6 flex items-center gap-1">
          {sessionsCompleted > 0 && Array.from({ length: sessionsCompleted }).map((_, i) => (
            <span key={i} className="text-sm animate-fade-in" title="Completed Focus Session">🐝</span>
          ))}
          {sessionsCompleted === 0 && !isRunning && !isEditing && (
            <span className="text-[11px] text-secondary-300">Ready to focus!</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          {isRunning ? (
            <button
              onClick={handlePause}
              className="px-6 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-6 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {timeLeft < duration && timeLeft > 0 ? "Resume" : "Start"}
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );

  // If we are on the dashboard and found the portal node, render it there
  if (isDashboard) {
    if (portalNode) return createPortal(timerContent, portalNode);
    // If running before the dashboard mounts, just return null briefly
    return null;
  }

  // Otherwise return floating content
  return timerContent;
}
