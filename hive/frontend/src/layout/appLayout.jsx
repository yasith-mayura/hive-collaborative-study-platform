import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/components/partials/navbar/NavBar";
import AppSidebar from "@/components/partials/sidebar/sidebar";

import PomodoroTimer from "@/components/PomodoroTimer";

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="min-h-screen xl:flex bg-primary relative">
      <div className="border">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity backdrop-blur-sm"
          onClick={toggleMobileSidebar}
        />
      )}

      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[288px]" : "lg:ml-[88px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-2 mx-auto max-w-(--breakpoint-2xl) md:p-2">
          <Outlet />
        </div>
      </div>
      <PomodoroTimer />
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