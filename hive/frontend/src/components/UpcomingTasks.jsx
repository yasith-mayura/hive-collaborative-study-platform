import React from "react";

const tasks = [
    {
        title: "Group Discussion OOP",
    },
    {
        title: "Mid Terms - Requirement Engineering",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing",
    },
    {
        title: "Group Discussion OOP",
    },
];

export default function UpcomingTasks() {
    return (
        <div>
            <h3 className="text-sm font-semibold text-secondary-700 mb-3">
                Upcoming tasks
            </h3>
            <div className="space-y-3">
                {tasks.map((task, index) => (
                    <div
                        key={index}
                        className="border-l-[3px] border-primary-400 pl-3 py-1"
                    >
                        <p className="text-sm font-medium text-secondary-800">
                            {task.title}
                        </p>
                        {task.description && (
                            <p className="text-xs text-secondary-400 mt-0.5 leading-relaxed">
                                {task.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
