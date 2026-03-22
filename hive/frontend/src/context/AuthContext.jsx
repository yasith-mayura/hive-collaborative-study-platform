import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import { logoutSession, registerUser, verifyToken } from "@/services";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = "token";

const getErrorMessage = (error, fallbackMessage) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(true);

  const setAuthState = (firebaseUser, backendUser = null) => {
    setUser(firebaseUser || null);
    setRole(backendUser?.role || "student");
  };

  const clearSession = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthState(null, null);
  };

  const syncSessionFromFirebaseUser = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem(TOKEN_KEY, idToken);

    const verifiedUser = await verifyToken(idToken);
    setAuthState(firebaseUser, verifiedUser);

    return verifiedUser;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        await clearSession();
        setLoading(false);
        return;
      }

      try {
        await syncSessionFromFirebaseUser(currentUser);
      } catch (error) {
        // If backend verification fails, clear stale state and sign the user out.
        await signOut(auth);
        await clearSession();
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const signup = async ({ name, email, password, studentNumber }) => {
    try {
      await registerUser({ name, email, password, studentNumber });
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await syncSessionFromFirebaseUser(credential.user);
      return credential.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Signup failed"));
    }
  };

  const login = async ({ email, password }) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await syncSessionFromFirebaseUser(credential.user);
      return credential.user;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Login failed"));
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (token) {
        await logoutSession(token);
      }
    } catch (error) {
      // Ignore backend logout failures so local logout always succeeds.
    } finally {
      await signOut(auth);
      await clearSession();
    }
  };

  const refreshAuthUser = async () => {
    if (!auth.currentUser) return null;

    await auth.currentUser.reload();
    setUser(auth.currentUser);

    return auth.currentUser;
  };

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      isAuthenticated: !!user,
      signup,
      login,
      logout,
      refreshAuthUser,
       token: localStorage.getItem(TOKEN_KEY),
    }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};