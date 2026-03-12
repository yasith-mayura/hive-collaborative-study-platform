import React from "react";

export default function GPAWidget({ gpa = 3.65, maxGpa = 4.0 }) {
  const percentage = (gpa / maxGpa) * 100;

  // SVG arc parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Show ~75% of the circle as the track (270 degrees)
  const trackLength = circumference * 0.75;
  const trackGap = circumference * 0.25;
  const progressLength = trackLength * (percentage / 100);
  const progressGap = circumference - progressLength;

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold text-secondary-700 mb-4 self-start">
        Academic Progress
      </h3>

      {/* GPA Ring */}
      <div className="relative w-[160px] h-[160px] flex items-center justify-center">
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 140 140"
          style={{ transform: "rotate(135deg)" }}
        >
          {/* Background track (270 degrees) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${trackLength} ${trackGap}`}
          />
          {/* Progress arc */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#1E293B"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${progressGap}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>

        {/* Center content */}
        <div className="flex flex-col items-center z-10">
          <span className="text-lg">🐝</span>
          <span className="text-xs font-medium text-secondary-500 tracking-wide">
            GPA
          </span>
          <span className="text-3xl font-bold text-secondary-900">
            {gpa.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Motivational text */}
      <p className="text-sm font-medium text-secondary-700 mt-2">
        Great job keep it up !
      </p>
    </div>
  );
}
