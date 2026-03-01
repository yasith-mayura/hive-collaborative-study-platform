import React, { createContext, useContext, useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
}

let app = null
let auth = null

// Only initialize Firebase if we have a valid API key
try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
  }
} catch (error) {
  console.warn('Firebase initialization skipped:', error.message)
}

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ email: 'test@demo.com', uid: 'demo-user' }) // Demo user for testing
  
  useEffect(() => {
    if (auth) {
      return onAuthStateChanged(auth, (u) => setUser(u))
    }
  }, [])
  
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
