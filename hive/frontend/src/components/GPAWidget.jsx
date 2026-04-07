import React, { useEffect, useState } from "react";
import { getProgressSummary } from "@/services/progressService";
import { useAuth } from "@/context/AuthContext";

export default function GPAWidget({ maxGpa = 4.0 }) {
  const { user, role, viewMode } = useAuth();
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const fetchGPA = async () => {
      try {
        if (!user?.uid) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        setLoading(true);
        // If it's an admin previewing a student, we might need a specific userId, 
        // but for a student dashboard, getProgressSummary() with no args handles the logged-in user.
        const isAdminPreviewingStudent =
          (role === "admin" || role === "superadmin") && viewMode === "student";

        const data = await getProgressSummary(isAdminPreviewingStudent ? user.uid : undefined);
        console.log("GPA Summary fetched:", data);

        const currentGPA = data?.currentGPA ?? 0;
        setGpa(currentGPA);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch GPA summary:", err);
        setError("Unable to load GPA");
        setGpa(0);
      } finally {
        setLoading(false);
      }
    };

    fetchGPA();
  }, [user?.uid, role, viewMode]);

  useEffect(() => {
    if (gpa !== null && !loading) {
      const targetPercent = (gpa / maxGpa) * 100;
      // Small delay to ensure the SVG is rendered before starting animation
      const timer = setTimeout(() => {
        setAnimatedPercentage(targetPercent);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [gpa, loading, maxGpa]);

  // SVG arc parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Show ~75% of the circle as the track (270 degrees)
  const trackLength = circumference * 0.75;
  const trackGap = circumference * 0.25;
  const progressLength = trackLength * (animatedPercentage / 100);
  const progressGap = circumference - progressLength;

  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-semibold text-secondary-700 mb-4 self-start">
          Academic Progress
        </h3>
        <div className="flex items-center justify-center w-[160px] h-[160px]">
          <div className="animate-spin">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-secondary-900 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && gpa === 0) {
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-semibold text-secondary-700 mb-4 self-start">
          Academic Progress
        </h3>
        <div className="flex items-center justify-center w-[160px] h-[160px]">
          <p className="text-xs text-red-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold text-secondary-700 mb-4 self-start">
        Academic Progress
      </h3>

      {/* GPA Ring */}
      <div className="relative w-[160px] h-[160px] flex items-center justify-center group">
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 140 140"
          style={{ transform: "rotate(135deg)" }}
        >
          <defs>
            <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFCC00" />
              <stop offset="100%" stopColor="#FFB800" />
            </linearGradient>
          </defs>
          {/* Background track (270 degrees) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
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
            stroke="url(#gpaGradient)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${progressGap}`}
            style={{
              transition: "stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          />
        </svg>

        {/* Center content */}
        <div className="flex flex-col items-center z-10 text-center animate-in fade-in zoom-in duration-700">
          <span className="text-2xl mb-0.5 group-hover:scale-110 transition-transform">🐝</span>
          <span className="text-[12px] font-bold text-secondary-500 tracking-tight mb-[-2px]">
            Cumulative GPA
          </span>
          <span className="text-3xl font-extrabold text-secondary-900 tabular-nums">
            {gpa !== null ? gpa.toFixed(2) : "0.00"}
          </span>
          <span className="text-[12px] font-medium text-secondary-400">
            Out of {maxGpa.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Motivational text */}
      <p className="text-xs font-bold text-secondary-600 mt-4 px-4 py-1.5 bg-secondary-50 rounded-full border border-secondary-100 flex items-center gap-2">
        <span className="animate-pulse">✨</span>
        Great job, keep it up!
      </p>
    </div>
  );
}
