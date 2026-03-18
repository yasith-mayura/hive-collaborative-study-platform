import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Resources from "./pages/Resources";
import AISupport from "./pages/AISupport";
import FlashCards from "./pages/FlashCards";
import ProgressTracker from "./pages/ProgressTracker";
import Notes from "./pages/Notes";
import StudySession from "./pages/StudySession";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import NewAdmin from "./pages/superadmin/NewAdmin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import GroupManagement from "./pages/admin/GroupManagement";

import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import UserManagementSuperAdmin from "./pages/superadmin/UserManagementSuperAdmin";
import AdminManagement from "./pages/superadmin/AdminManagement";
import GroupManagementSuperAdmin from "./pages/superadmin/GroupsManagementSuperAdmin";

import AppLayout from "./layout/appLayout";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <>
      <ToastContainer theme="colored" position="top-center" />

      <Routes>
        {/* public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="resources" element={<Resources />} />
            <Route path="ai" element={<AISupport />} />
            <Route path="flashcards" element={<FlashCards />} />
            <Route path="progress" element={<ProgressTracker />} />
            <Route path="notes" element={<Notes />} />
            <Route path="session" element={<StudySession />} />

            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/groups" element={<GroupManagement />} />

            <Route path="superadmin" element={<SuperAdminDashboard />} />
            <Route path="superadmin/users" element={<UserManagementSuperAdmin />} />
            <Route path="superadmin/admins" element={<AdminManagement />} />
            <Route path="superadmin/groups" element={<GroupManagementSuperAdmin />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}