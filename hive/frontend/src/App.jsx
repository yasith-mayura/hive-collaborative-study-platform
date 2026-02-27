import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Resources from './pages/Resources'
import AISupport from './pages/AISupport'
import FlashCards from './pages/FlashCards'
import ProgressTracker from './pages/ProgressTracker'
import Notes from './pages/Notes'
import StudySession from './pages/StudySession'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import GroupManagement from './pages/admin/GroupManagement'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/ai" element={<AISupport />} />
        <Route path="/flashcards" element={<FlashCards />} />
        <Route path="/progress" element={<ProgressTracker />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/session" element={<StudySession />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/groups" element={<GroupManagement />} />
      </Route>
    </Routes>
  )
}
