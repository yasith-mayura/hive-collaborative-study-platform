import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "@/context/sidebarContext";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/Icon";

const navItems = [
  {
    icon: "home",
    name: "Dashboard",
    path: "/",
    allowed: ["student"],
  },
  {
    icon: "chat-bubble-left-right",
    name: "Chat",
    path: "/chat",
    allowed: ["student"],
  },
  {
    icon: "folder-open",
    name: "Resources",
    path: "/resources",
    allowed: ["student"],
  },
  {
    icon: "clock",
    name: "Study Session Reminders",
    path: "/session",
    allowed: ["student"],
  },
  {
    icon: "rectangle-stack",
    name: "Flashcard Creation",
    path: "/flashcards",
    allowed: ["student"],
  },
  {
    icon: "chart-bar",
    name: "Progress Tracking",
    path: "/progress",
    allowed: ["student"],
  },
  {
    icon: "book-open",
    name: "Notes",
    path: "/notes",
    allowed: ["student"],
  },
  // Admin  specific items
  {
    icon: "home",
    name: "Dashboard",
    path: "/admin",
    allowed: ["admin"],
  },
  {
    icon: "users",
    name: "User Management",
    path: "/admin/users",
    allowed: ["admin"],
  },
  {
    icon: "clock",
    name: "Study Session Reminders",
    path: "/admin/session",
    allowed: ["admin"],
  },
  {
    icon: "folder-open",
    name: "Resources",
    path: "/resources",
    allowed: ["admin"],
  },
  {
    icon: "chart-bar",
    name: "Academic Progress",
    path: "/progress",
    allowed: ["admin"],
  },
  // Superadmin specific items
  {
    icon: "home",
    name: "Dashboard",
    path: "/superadmin",
    allowed: ["superadmin"],
  },
  {
    icon: "users",
    name: "User Management",
    path: "/superadmin/users",
    allowed: ["superadmin"],
  },
  {
    icon: "shield-exclamation",
    name: "Admin Management",
    path: "/superadmin/admins",
    allowed: ["superadmin"],
  },
  {
    icon: "users",
    name: "Groups",
    path: "/superadmin/groups",
    allowed: ["superadmin"],
  },
  {
    icon: "folder-open",
    name: "Resources",
    path: "/resources",
    allowed: ["superadmin"],
  },
  {
    icon: "book-open",
    name: "Course Management",
    path: "/superadmin/courses",
    allowed: ["superadmin"],
  },
  {
    icon: "chart-bar",
    name: "Batch Level Assignment",
    path: "/superadmin/batch-levels",
    allowed: ["superadmin"],
  },
];

const AppSidebar = () => {
  const { isExpanded, toggleSidebar, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const { role, viewMode, toggleViewMode } = useAuth();

  const handleSubmenuToggle = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  const handleModeSwitch = () => {
    toggleViewMode();
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
    // Navigate to the appropriate dashboard
    if (viewMode === "admin") {
      navigate("/");
    } else {
      navigate("/admin");
    }
  };

  const isItemActive = (path) => {
    if (path === "/resources") {
      return location.pathname === "/resources" || location.pathname.startsWith("/resources/");
    }
    return location.pathname === path;
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white text-secondary-500 transition-all border duration-300 ease-in-out border-gray-200 z-50
        ${isExpanded || isMobileOpen ? "w-[250px] lg:w-[288px]" : "w-[88px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div className="flex items-center justify-between py-4 px-5">
        <Link to="/" onClick={() => isMobileOpen && toggleMobileSidebar()}>
          {isExpanded || isMobileOpen ? (
            <>
              <img src="/logo.png" alt="Hive Logo" width={80} height={32} />
            </>
          ) : (
            <img src="/logo-collapsed.png" alt="Hive Logo" width={32} height={32} />
          )}
        </Link>
        <button
          onClick={toggleMobileSidebar}
          className="text-secondary-400 lg:hidden"
        >
          <Icon icon="heroicons-outline:x-mark" className="w-6 h-6" />
        </button>
      </div>

      <nav className="mt-4 px-4">
        <ul className="space-y-3">
          {navItems
            .filter((item) => item.allowed.includes(viewMode))
            .map((item, index) => (
              <li key={index}>
                {item.subItems ? (
                  // Submenu Button
                  <button
                    onClick={() => handleSubmenuToggle(index)}
                    className={`flex items-center w-full px-4 py-3 rounded-md hover:bg-primary-100 transition
            ${!(isExpanded || isMobileOpen) ? "justify-center" : ""}
            ${openSubmenu === index ? "bg-primary-100 text-primary-800" : ""}`}
                  >
                    <Icon
                      icon={`heroicons-outline:${item.icon}`}
                      className={`w-6 h-6`}
                    />
                    {(isExpanded || isMobileOpen) && <span className="ml-3">{item.name}</span>}
                    {(isExpanded || isMobileOpen) && (
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
                    onClick={() => isMobileOpen && toggleMobileSidebar()}
                    className={`flex items-center px-4 py-3 rounded-md transition ${!(isExpanded || isMobileOpen) ? "justify-center" : ""} ${isItemActive(item.path)
                      ? "bg-primary-300 font-semibold text-primary-900"
                      : "bg-primary-50 hover:bg-primary-100"
                      }`}
                  >
                    <Icon
                      icon={`heroicons-outline:${item.icon}`}
                      className={`w-6 h-6 `}
                    />
                    {(isExpanded || isMobileOpen) && <span className="ml-3">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
        </ul>
      </nav>

      {/* Switch Mode Button — only for admins */}
      {role === "admin" && (
        <div className="absolute bottom-0 left-0 w-full px-4 py-4 border-t border-gray-200">
          <button
            onClick={handleModeSwitch}
            className={`flex items-center w-full px-4 py-3 rounded-md bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-medium transition ${!isExpanded && !isMobileOpen ? "justify-center" : ""}`}
          >
            <Icon
              icon={viewMode === "admin" ? "heroicons-outline:academic-cap" : "heroicons-outline:shield-check"}
              className="w-5 h-5"
            />
            {(isExpanded || isMobileOpen) && (
              <span className="ml-3 text-sm">
                {viewMode === "admin" ? "Switch to Student" : "Switch to Admin"}
              </span>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
