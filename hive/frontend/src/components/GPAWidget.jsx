import React, { useEffect, useState } from "react";
import { getProgress, getProgressByUserId } from "@/services/progressService";
import { useAuth } from "@/context/AuthContext";

export default function GPAWidget({ maxGpa = 4.0 }) {
  const { user, role, viewMode } = useAuth();
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGPA = async () => {
      try {
        if (!user?.uid) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        setLoading(true);
        const isAdminPreviewingStudent =
          (role === "admin" || role === "superadmin") && viewMode === "student";

        const data = isAdminPreviewingStudent
          ? await getProgressByUserId(user.uid)
          : await getProgress();
        console.log("Progress data fetched:", data);
        
        // Handle both single-record and array responses defensively.
        const record = Array.isArray(data)
          ? data.find((item) => item?.userId === user.uid) || null
          : data;

        const cumulativeGPA =
          record?.cumulativeGPA !== undefined ? record.cumulativeGPA : null;
        
        if (cumulativeGPA === null || cumulativeGPA === undefined) {
          console.warn("Cumulative GPA not found in response. Full response:", data);
          setError("GPA data not available");
          setGpa(0);
        } else {
          setGpa(cumulativeGPA);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch cumulative GPA:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError("Unable to load GPA");
        setGpa(0);
      } finally {
        setLoading(false);
      }
    };

    fetchGPA();
  }, [user?.uid, role, viewMode]);

  const percentage = gpa !== null ? (gpa / maxGpa) * 100 : 0;

  // SVG arc parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Show ~75% of the circle as the track (270 degrees)
  const trackLength = circumference * 0.75;
  const trackGap = circumference * 0.25;
  const progressLength = trackLength * (percentage / 100);
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

  if (error) {
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
            {gpa !== null ? gpa.toFixed(2) : "0.00"}
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
