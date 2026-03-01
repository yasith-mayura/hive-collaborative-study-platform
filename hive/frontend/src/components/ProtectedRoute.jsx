import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute() {
  const token = localStorage.getItem('token')
  // Temporarily bypass auth for testing - remove this later
  const isDevelopment = import.meta.env.DEV
  if (!token && !isDevelopment) return <Navigate to="/login" replace />
  return <Outlet />
}
