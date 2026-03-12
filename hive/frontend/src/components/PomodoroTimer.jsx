import React, { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_MINUTES = 25;

export default function PomodoroTimer() {
  const [duration, setDuration] = useState(DEFAULT_MINUTES * 60); // total seconds
  const [timeLeft, setTimeLeft] = useState(DEFAULT_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(String(DEFAULT_MINUTES));
  const [showBreakNotification, setShowBreakNotification] = useState(false);
  const intervalRef = useRef(null);
  const inputRef = useRef(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendBreakNotification = useCallback(() => {
    setShowBreakNotification(true);

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🐝 Time's up!", {
        body: "Great work! Take a short break to recharge.",
        icon: "/logo-collapsed.png",
      });
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            sendBreakNotification();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, sendBreakNotification]);

  const handleStart = () => {
    setShowBreakNotification(false);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const handleReset = () => {
    setIsRunning(false);
    setShowBreakNotification(false);
    clearInterval(intervalRef.current);
    setTimeLeft(duration);
  };

  const handleTimeClick = () => {
    if (!isRunning) {
      setIsEditing(true);
      setInputMinutes(String(Math.ceil(duration / 60)));
      setTimeout(() => inputRef.current?.select(), 50);
    }
  };

  const handleInputConfirm = () => {
    const mins = Math.max(1, Math.min(120, parseInt(inputMinutes) || DEFAULT_MINUTES));
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

  // SVG circle progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? timeLeft / duration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      {/* Break Notification Banner */}
      {showBreakNotification && (
        <div className="w-full mb-3 px-3 py-2.5 bg-primary-100 border border-primary-300 rounded-lg flex items-center gap-2 animate-fade-in">
          <span className="text-lg">🐝</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary-900">Time's up!</p>
            <p className="text-xs text-primary-700">
              Take a short break to recharge.
            </p>
          </div>
          <button
            onClick={() => setShowBreakNotification(false)}
            className="text-primary-600 hover:text-primary-800 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Timer circle */}
      <div
        className={`relative w-[140px] h-[140px] flex items-center justify-center ${!isRunning ? "cursor-pointer" : ""
          }`}
        onClick={handleTimeClick}
        title={!isRunning ? "Click to set time" : ""}
      >
        <svg
          className="absolute top-0 left-0 w-full h-full -rotate-90"
          viewBox="0 0 120 120"
        >
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={timeLeft === 0 ? "#FFCC00" : "#1E293B"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
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
              <span className="text-xs text-secondary-400">min</span>
            </div>
          ) : (
            <>
              <span className="text-2xl font-bold text-secondary-800 tracking-wider">
                {minutes} : {seconds}
              </span>
              <span className="text-lg ml-1">🐝</span>
            </>
          )}
        </div>
      </div>

      {/* Hint text */}
      {!isRunning && !isEditing && (
        <p className="text-[11px] text-secondary-300 mt-1">
          Click timer to change duration
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-4 mt-3">
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
            disabled={timeLeft === 0}
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
  );
}
