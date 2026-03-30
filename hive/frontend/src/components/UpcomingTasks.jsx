import React from "react";
import { getSubjectColor } from "@/lib/colors";

export default function UpcomingTasks({ tasks = [], loading = false, onTaskClick }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-secondary-700 mb-3">
                Upcoming tasks
            </h3>
            <div className="space-y-3 font-inter">
                {loading && (
                    <p className="text-xs text-secondary-400 italic">Finding your next buzz... 🐝</p>
                )}

                {!loading && tasks.length === 0 && (
                    <p className="text-xs text-secondary-400 italic">No upcoming tasks. Time to relax! 🍯</p>
                )}

                {!loading && tasks.map((task, index) => {
                    const subjectColor = getSubjectColor(task.subjectCode);
                    const isClickable = !!onTaskClick;
                    const Component = isClickable ? "button" : "div";

                    return (
                        <Component
                            key={task._id || index}
                            type={isClickable ? "button" : undefined}
                            onClick={isClickable ? () => onTaskClick(task) : undefined}
                            className={`w-full text-left p-3 rounded-r-xl transition-all border-l-[4px] shadow-sm flex flex-col gap-1.5 ${isClickable ? "hover:scale-[1.02] cursor-pointer" : ""
                                }`}
                            style={{
                                backgroundColor: subjectColor.bg,
                                borderLeftColor: subjectColor.border,
                                color: subjectColor.text
                            }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[13px] font-bold leading-tight">
                                    {task.topic || task.title}
                                </p>
                                <span
                                    className="text-[8px] px-1.5 py-0.5 rounded-md font-bold tracking-tight whitespace-nowrap"
                                    style={{ backgroundColor: `${subjectColor.border}33`, color: subjectColor.text }}
                                >
                                    {task.type}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 opacity-70 font-semibold text-[10px]">
                                <span>
                                    {task.time} • {new Date(task.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="opacity-60">•</span>
                                <span className="truncate max-w-[80px]">
                                    {task.subjectCode}
                                </span>
                            </div>
                        </Component>
                    );
                })}
            </div>
        </div>
    );
}
