// src/context/AuthContext.jsx
// Single source of truth for auth state and admin role (from Firestore).
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { clearAdminSession } from "../utils/sessionSecurity";

const AuthContext = createContext({
  user: null,
  role: null,
  isAdmin: false,
  authLoading: true,
});

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isAdmin = Boolean(user && role && String(role).toLowerCase() === "admin");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser || null);
      if (!firebaseUser) {
        setRole(null);
        clearAdminSession();
        setAuthLoading(false);
        return;
      }
      try {
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!userSnap.exists()) {
          setRole(null);
          setAuthLoading(false);
          return;
        }
        const data = userSnap.data();
        const accountStatus = String(data.status || "ACTIVE").toUpperCase();

        // Force sign-out for banned/suspended accounts
        if (accountStatus === "BANNED" || accountStatus === "SUSPENDED") {
          await signOut(auth);
          setUser(null);
          setRole(null);
          clearAdminSession();
          setAuthLoading(false);
          return;
        }

        setRole(data.role || null);
      } catch (err) {
        console.error("AuthContext: error reading user role", err);
        setRole(null);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const value = {
    user,
    role,
    isAdmin,
    authLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
