import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/context/sidebarContext";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/Icon";

const navItems = [
  {
    icon: "home",
    name: "Dashboard",
    path: "/",
    allowed: ["student", "admin", "superAdmin"],
  },
  {
    icon: "chat-bubble-left-right",
    name: "Chat",
    path: "/chat",
    allowed: ["student", "admin", "superAdmin"],
  },
  {
    icon: "folder-open",
    name: "Resources",
    path: "/resources",
    allowed: ["student", "admin", "superAdmin"],
  },
  {
    icon: "sparkles",
    name: "AI Support",
    path: "/ai",
    allowed: ["student", "admin", "superAdmin"],
  },
  {
    icon: "clock",
    name: "Study Session Reminders",
    path: "/session",
    allowed: ["student", "admin", "superAdmin"],
  },
  {
    icon: "rectangle-stack",
    name: "Flashcard Creation",
    path: "/flashcards",
    allowed: ["student", "admin", "superAdmin"],
  },
  {
    icon: "chart-bar",
    name: "Progress Tracking",
    path: "/progress",
    allowed: ["student", "admin", "superAdmin"],
  },
  {
    icon: "book-open",
    name: "Notes",
    path: "/notes",
    allowed: ["student", "admin", "superAdmin"],
  },
];

const AppSidebar = () => {
  const { isExpanded, toggleSidebar, isMobileOpen } = useSidebar();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const { authData } = useAuth();

  authData.role = "ADMIN"; // For testing purposes, set role to ADMIN

  const { role } = useAuth(); // ✅ from firebase context

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white text-secondary-500 transition-all border duration-300 ease-in-out border-gray-200 z-50
        ${isExpanded || isMobileOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div className="flex items-center justify-between justify-center py-4 px-5">
        <Link to="/">
          {isExpanded || isMobileOpen ? (
            <>
              <img src="/logo.png" alt="Hive Logo" width={80} height={32} />
            </>
          ) : (
            <img src="/logo-collapsed.png" alt="Hive Logo" width={32} height={32} />
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="text-secondary-400 lg:hidden"
        >
          {isExpanded ? (
            <Icon icon="heroicons-outline:x-mark" className="w-6 h-6" />
          ) : (
            <Icon icon="heroicons-outline:bars-3" className="w-6 h-6" />
          )}
        </button>
      </div>

      <nav className="mt-4 px-4">
        <ul className="space-y-3">
          {navItems
            .filter((item) => item.allowed.includes(role)) // ✅
            .map((item, index) => (
              <li key={index}>
                {item.subItems ? (
                  // Submenu Button
                  <button
                    onClick={() => handleSubmenuToggle(index)}
                    className={`flex items-center w-full px-4 py-3 rounded-md hover:bg-primary-100 transition
            ${!isExpanded ? "justify-center" : ""}
            ${openSubmenu === index ? "bg-primary-100 text-primary-800" : ""}`}
                  >
                    <Icon
                      icon={`heroicons-outline:${item.icon}`}
                      className={`w-6 h-6`}
                    />
                    {isExpanded && <span className="ml-3">{item.name}</span>}
                    {isExpanded && (
                      <Icon
                        icon={`heroicons-outline:chevron-down`}
                        className={`w-6 h-6 ml-auto transition-transform ${openSubmenu === index ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </button>
                ) : (
                  // Normal Navigation Link
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-md hover:bg-primary-100 transition ${!isExpanded ? "justify-center" : ""} ${location.pathname === item.path
                      ? "bg-primary-300 font-semibold text-primary-900"
                      : "bg-primary-50"
                      }`}
                  >
                    <Icon
                      icon={`heroicons-outline:${item.icon}`}
                      className={`w-6 h-6 `}
                    />
                    {isExpanded && <span className="ml-3">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AppSidebar;
