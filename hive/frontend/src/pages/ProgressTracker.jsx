import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/Icon";

// Grade to GPA mapping
const GRADE_MAP = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  E: 0.0,
};

const GRADE_OPTIONS = Object.keys(GRADE_MAP);

// Sample semester history
const initialSemesterData = [
  { semester: "1/1", gpa: 3.65 },
  { semester: "1/2", gpa: 2.7 },
  { semester: "2/1", gpa: 2.85 },
  { semester: "2/2", gpa: 3.4 },
  { semester: "3/1", gpa: 3.2 },
  { semester: "3/2", gpa: 3.55 },
  { semester: "4/1", gpa: 3.45 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100">
        <p className="text-xs text-secondary-500">{label}</p>
        <p className="text-sm font-semibold text-secondary-800">
          GPA: {payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function ProgressTracker() {
  const [semesterData, setSemesterData] = useState(initialSemesterData);
  const [modules, setModules] = useState([
    { name: "", grade: "", credits: 3 },
    { name: "", grade: "", credits: 3 },
    { name: "", grade: "", credits: 3 },
  ]);
  const [calculatedGpa, setCalculatedGpa] = useState(null);

  const currentGpa =
    semesterData.length > 0
      ? semesterData[semesterData.length - 1].gpa
      : 0;

  const handleModuleChange = (index, field, value) => {
    const updated = [...modules];
    updated[index][field] = field === "credits" ? Number(value) || 0 : value;
    setModules(updated);
  };

  const handleAddModule = () => {
    setModules([...modules, { name: "", grade: "", credits: 3 }]);
  };

  const handleRemoveModule = (index) => {
    if (modules.length > 1) {
      setModules(modules.filter((_, i) => i !== index));
    }
  };

  const handleCalculateGpa = () => {
    const validModules = modules.filter(
      (m) => m.name.trim() && m.grade && m.credits > 0
    );
    if (validModules.length === 0) return;

    let totalPoints = 0;
    let totalCredits = 0;
    validModules.forEach((m) => {
      const gradePoint = GRADE_MAP[m.grade] ?? 0;
      totalPoints += gradePoint * m.credits;
      totalCredits += m.credits;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    setCalculatedGpa(parseFloat(gpa.toFixed(2)));
  };

  const handleSaveSemester = () => {
    if (calculatedGpa === null) return;
    const nextYear = Math.floor(semesterData.length / 2) + 1;
    const nextSem = (semesterData.length % 2) + 1;
    setSemesterData([
      ...semesterData,
      { semester: `${nextYear}/${nextSem}`, gpa: calculatedGpa },
    ]);
    setCalculatedGpa(null);
    setModules([
      { name: "", grade: "", credits: 3 },
      { name: "", grade: "", credits: 3 },
      { name: "", grade: "", credits: 3 },
    ]);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page title */}
      <h1 className="text-xl font-bold text-secondary-800">Progress Tracker</h1>

      {/* Current GPA */}
      <div className="text-3xl font-bold text-secondary-800">
        {currentGpa.toFixed(2)}
      </div>

      {/* GPA Line Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={semesterData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="6 6"
              stroke="#E5E7EB"
              vertical={true}
            />
            <XAxis
              dataKey="semester"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={{ stroke: "#D1D5DB" }}
              tickLine={false}
              label={{
                value: "Year / Semester",
                position: "insideBottomRight",
                offset: -5,
                style: { fill: "#9CA3AF", fontSize: 11 },
              }}
            />
            <YAxis
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={{ stroke: "#D1D5DB" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: "#9CA3AF" }}
            />
            <Line
              type="monotone"
              dataKey="gpa"
              name="GPA"
              stroke="#FFCC00"
              strokeWidth={2.5}
              dot={{
                r: 5,
                fill: "#FFCC00",
                stroke: "#393E41",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 7,
                fill: "#FFCC00",
                stroke: "#393E41",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Course Module Results */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-secondary-800 mb-4">
          Course Module Results
        </h2>

        <div className="space-y-3">
          {modules.map((mod, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3"
            >
              {/* Module Name */}
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide mb-0.5 block">
                  Module Name
                </label>
                <input
                  type="text"
                  placeholder="Module Name"
                  value={mod.name}
                  onChange={(e) =>
                    handleModuleChange(index, "name", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-sm text-secondary-800 placeholder:text-secondary-300 border-b border-secondary-200 pb-1"
                />
              </div>

              {/* Grade */}
              <div className="w-[100px]">
                <label className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide mb-0.5 block">
                  Grade
                </label>
                <select
                  value={mod.grade}
                  onChange={(e) =>
                    handleModuleChange(index, "grade", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-sm text-secondary-800 border-b border-secondary-200 pb-1 cursor-pointer"
                >
                  <option value="">--</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credits */}
              <div className="w-[70px]">
                <label className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide mb-0.5 block">
                  Credits
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={mod.credits}
                  onChange={(e) =>
                    handleModuleChange(index, "credits", e.target.value)
                  }
                  className="w-full bg-transparent outline-none text-sm text-secondary-800 border-b border-secondary-200 pb-1"
                />
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemoveModule(index)}
                className="text-secondary-300 hover:text-red-400 transition mt-3"
                title="Remove module"
              >
                <Icon
                  icon="heroicons-outline:x-mark"
                  className="w-4 h-4"
                />
              </button>
            </div>
          ))}
        </div>

        {/* Add module link */}
        <button
          onClick={handleAddModule}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-secondary-500 hover:text-secondary-700 transition"
        >
          <Icon icon="heroicons-outline:plus" className="w-3.5 h-3.5" />
          Add Module
        </button>

        {/* Calculate + Save buttons */}
        <div className="flex items-center gap-4 mt-5">
          <button
            onClick={handleCalculateGpa}
            disabled={
              !modules.some(
                (m) => m.name.trim() && m.grade && m.credits > 0
              )
            }
            className="px-6 py-2.5 bg-primary-400 text-secondary-800 text-sm font-semibold rounded-lg hover:bg-primary-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Calculate GPA
          </button>

          {calculatedGpa !== null && (
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-secondary-800">
                Semester GPA:{" "}
                <span className="text-primary-600">{calculatedGpa}</span>
              </span>
              <button
                onClick={handleSaveSemester}
                className="px-5 py-2 bg-secondary-700 text-white text-sm font-medium rounded-lg hover:bg-secondary-800 transition"
              >
                Save to History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
