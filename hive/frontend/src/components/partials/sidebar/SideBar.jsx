import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useSidebar } from "@/context/sidebarContext";
import { useAuth } from "@/context/authContext";

import Icon from "@/components/ui/Icon";


const navItems = [
  {
    icon: "home",
    name: "Dashboard",
    path: "/",
    allowed: ["ADMIN"],
  },
  {
    icon: "chat-bubble-left-right",
    name: "Chat",
    path: "/chat",
    allowed: ["ADMIN"],
  },
  {
    icon: "folder-open",
    name: "Resources",
    path: "/resources",
    allowed: ["ADMIN"],
  },
  {
    icon: "sparkles",
    name: "AI Support",
    path: "/ai",
    allowed: ["ADMIN"],
  },
  {
    icon: "clock",
    name: "Study Session Reminders",
    path: "/session",
    allowed: ["ADMIN"],
  },
  {
    icon: "rectangle-stack",
    name: "Flashcard Creation",
    path: "/flashcards",
    allowed: ["ADMIN"],
  },
  {
    icon: "chart-bar",
    name: "Progress Tracking",
    path: "/progress",
    allowed: ["ADMIN"],
  },
  {
    icon: "book-open",
    name: "Notes",
    path: "/notes",
    allowed: ["ADMIN"],
  },
];

const AppSidebar = () => {
  const { isExpanded, toggleSidebar, isMobileOpen } = useSidebar();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const { authData } = useAuth();
  
  authData.role = "ADMIN"; // For testing purposes, set role to ADMIN

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white   text-gray-900 transition-all border duration-300 ease-in-out  border-gray-200 z-50
        ${isExpanded || isMobileOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div className="flex items-center justify-between py-4 px-5  border-b-black">
        <Link to="/">
          {isExpanded || isMobileOpen ? (
            <>
              <img
                className=""
                src="https://www.getcleveri.com/wp-content/uploads/2023/09/logo-dark.png"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="https://media.licdn.com/dms/image/v2/D4D0BAQG_iWsjky76hg/company-logo_200_200/company-logo_200_200/0/1710821661207/get_cleveri_logo?e=2147483647&v=beta&t=DcDCNGlpOCZxnBsfdXYqIaPtgjSrPeiMyKY5udpQHpw"
              alt="Logo"
              width={40}
              height={40}
            />
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="text-gray-500 dark:text-gray-400 lg:hidden"
        >
          {isExpanded ? (
            <Icon icon={`heroicons-outline:x-mark`} className={`w-6 h-6`} />
          ) : (
            <Icon icon={`heroicons-outline:bars-3`} className={`w-6 h-6`} />
          )}
        </button>
      </div>

      <nav className="mt-4 px-4">
        <ul className="space-y-2">
          {navItems
            .filter((item) => item.allowed.includes(authData.role))
            .map((item, index) => (
              <li key={index}>
                {item.subItems ? (
                  // Submenu Button
                  <button
                    onClick={() => handleSubmenuToggle(index)}
                    className={`flex items-center w-full px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition
            ${openSubmenu === index ? "bg-blue-200 dark:bg-gray-800" : ""}`}
                  >
                    {/* {item.icon} */}
                    <Icon
                      icon={`heroicons-outline:${item.icon}`}
                      className={`w-6 h-6`}
                    />
                    {isExpanded && <span className="ml-3">{item.name}</span>}
                    {isExpanded && (
                      <Icon
                        icon={`heroicons-outline:chevron-down`}
                        className={`w-6 h-6 ml-auto transition-transform ${
                          openSubmenu === index ? "rotate-180" : ""
                        }`}
                      />
                      // <ChevronDown
                      //   size={16}
                      //   className={`ml-auto transition-transform ${
                      //     openSubmenu === index ? "rotate-180" : ""
                      //   }`}
                      // />
                    )}
                  </button>
                ) : (
                  // Normal Navigation Link
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-md bg-blue-100 hover:bg-blue-300 transition ${
                      location.pathname === item.path
                        ? "bg-blue-200 font-semibold text-blue-700"
                        : ""
                    }`}
                  >
                    <Icon
                      icon={`heroicons-outline:${item.icon}`}
                      className={`w-6 h-6`}
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
