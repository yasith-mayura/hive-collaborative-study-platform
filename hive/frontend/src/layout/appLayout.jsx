import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/context/sidebarContext";
import AppHeader from "@/components/partials/navbar/NavBar";
import AppSidebar from "@/components/partials/sidebar/SideBar";

import PomodoroTimer from "@/components/PomodoroTimer";
import IntroVideoSplash from "@/components/ui/IntroVideoSplash";

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="min-h-screen lg:flex bg-primary relative">
      <div className="border">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[55] lg:hidden transition-opacity backdrop-blur-sm"
          onClick={toggleMobileSidebar}
        />
      )}

      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[332px]" : "lg:ml-[120px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-2 mx-auto max-w-(--breakpoint-2xl) md:p-2">
          <Outlet />
        </div>
      </div>
      <PomodoroTimer />
      <IntroVideoSplash />
    </div>
  );
};

export default function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}