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
    name: "Group Management",
    path: "/superadmin/groups",
    allowed: ["superadmin"],
  },
  {
    icon: "folder-open",
    name: "Resource Management",
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
  {
    icon: "chart-pie",
    name: "Academic Progress",
    path: "/progress",
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
      className={`fixed top-4 left-0 lg:left-4 bottom-4 h-[calc(100vh-2rem)] bg-white text-secondary-500 transition-transform duration-300 ease-in-out border border-gray-100 z-[60] shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem]
        ${isExpanded ? "lg:w-[300px]" : "w-[300px] lg:w-[88px]"}
        ${isMobileOpen ? "translate-x-4 lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="flex items-center justify-center h-24 relative mt-2">
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
          className="text-secondary-400 lg:hidden absolute right-6 top-1/2 -translate-y-1/2"
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
                    className={`flex items-center w-full px-4 py-3.5 transition-all duration-200 ${!(isExpanded || isMobileOpen) ? "justify-center mx-2" : "mx-4"}
            ${openSubmenu === index ? "bg-primary-300 text-primary-900 rounded-full shadow-sm font-bold" : "text-secondary-400 hover:bg-primary-50 rounded-full hover:text-secondary-600"}`}
                  >
                    <Icon
                      icon={`heroicons-outline:${item.icon}`}
                      className="w-6 h-6 flex-shrink-0"
                    />
                    {(isExpanded || isMobileOpen) && <span className="ml-2 whitespace-nowrap">{item.name}</span>}
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
                    className={`flex items-center px-4 py-3.5 transition-all duration-200 ${!(isExpanded || isMobileOpen) ? "justify-center mx-2" : "mx-4"} ${isItemActive(item.path)
                      ? "bg-primary-300 font-bold text-primary-900 rounded-full shadow-sm"
                      : "text-secondary-400 hover:bg-primary-50 rounded-full hover:text-secondary-600"
                      }`}
                  >
                    <Icon
                      icon={`heroicons-outline:${item.icon}`}
                      className="w-6 h-6 flex-shrink-0"
                    />
                    {(isExpanded || isMobileOpen) && <span className="ml-2 font-medium whitespace-nowrap">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
        </ul>
      </nav>


      {/* Decorative Bottom Card & Switch Mode — only for admins */}
      <div className="absolute bottom-8 left-0 w-full px-6 space-y-4">

        {(role === "admin" || role === "superadmin") && (
          <button
            onClick={handleModeSwitch}
            className={`flex items-center w-full px-5 py-3.5 rounded-full bg-secondary-50 hover:bg-secondary-100 text-secondary-700 font-bold transition-all text-force-tiny ${!isExpanded && !isMobileOpen ? "justify-center" : ""}`}
            style={{ fontSize: "12px" }}
          >
            <Icon
              icon={viewMode === "admin" || viewMode === "superadmin" ? "heroicons-outline:academic-cap" : "heroicons-outline:shield-check"}
              className="w-5 h-5 flex-shrink-0"
            />
            {(isExpanded || isMobileOpen) && (
              <span
                className="ml-3 uppercase tracking-widest font-bold text-force-tiny"
                style={{ fontSize: "12px" }}
              >
                {viewMode === "admin" || viewMode === "superadmin" ? "Student Mode" : "Admin Mode"}
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
