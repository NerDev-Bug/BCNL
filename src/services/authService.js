// src/services/authService.js
import { auth, db } from "../firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth"
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore"

// ✅ helper: validate username (same rules as UI)
const validateUsername = (value) => {
  const u = String(value || "").trim()
  if (!u) return "Username is required"
  if (u.length < 3) return "Username must be at least 3 characters"
  if (u.length > 20) return "Username must be at most 20 characters"
  if (!/^[a-zA-Z0-9_]+$/.test(u))
    return "Only letters, numbers, and underscore (_) allowed"
  return null
}

// ✅ helper: check username uniqueness using /usernames/{usernameLower}
const isUsernameTaken = async (usernameLower) => {
  const snap = await getDoc(doc(db, "usernames", usernameLower))
  return snap.exists()
}

/**
 * REGISTER user
 */
export const registerUser = async (email, password, username) => {
  try {
    const cleanEmail = String(email || "").trim()
    const cleanUsername = String(username || "").trim()
    const usernameLower = cleanUsername.toLowerCase()

    // ✅ username validation
    const uErr = validateUsername(cleanUsername)
    if (uErr) throw { code: "username-invalid", message: uErr }

    // ✅ check taken (no query)
    const taken = await isUsernameTaken(usernameLower)
    if (taken) throw { code: "username-taken", message: "Username is already taken" }

    // ✅ Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
    const user = userCredential.user

    // ✅ Reserve username (auto-creates /usernames collection)
    await setDoc(doc(db, "usernames", usernameLower), {
      uid: user.uid,
      username: cleanUsername,
      email: user.email, // ✅ needed for username login + reset
      createdAt: serverTimestamp(),
    })

    // ✅ Save profile
    await setDoc(doc(db, "users", user.uid), {
      username: cleanUsername,
      usernameLower,
      email: user.email,
      role: "customer",
      createdAt: serverTimestamp(),
    })

    return user
  } catch (err) {
    let friendlyMessage = err?.message || "Registration failed"

    // custom errors
    if (err?.code === "username-invalid") friendlyMessage = err.message
    else if (err?.code === "username-taken") friendlyMessage = err.message

    // firebase errors
    else if (err?.code === "auth/email-already-in-use") {
      friendlyMessage = "Email is already registered"
    } else if (err?.code === "auth/invalid-email") {
      friendlyMessage = "Invalid email format"
    } else if (err?.code === "auth/weak-password") {
      friendlyMessage = "Password is too weak (min 6 characters)"
    }

    throw { code: err?.code || "register-error", message: friendlyMessage }
  }
}

/**
 * LOGIN user with role (email only — username handled in LoginModal)
 */
export const loginUser = async (email, password) => {
  try {
    const cleanEmail = String(email || "").trim()

    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
    const user = userCredential.user

    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (!userDoc.exists()) {
      throw { code: "user-not-found", message: "User record not found" }
    }

    const userData = userDoc.data()
    const accountStatus = String(userData.status || "ACTIVE").toUpperCase()

    if (accountStatus === "BANNED") {
      await auth.signOut()
      throw { code: "account-banned", message: "Your account has been permanently banned. Please contact support." }
    }
    if (accountStatus === "SUSPENDED") {
      await auth.signOut()
      throw { code: "account-suspended", message: "Your account is temporarily suspended. Please contact support." }
    }

    return { user, role: userData.role }
  } catch (err) {
    let friendlyMessage = err?.message || "Login failed"

    if (err?.code === "auth/wrong-password") friendlyMessage = "Wrong password"
    else if (err?.code === "auth/user-not-found") friendlyMessage = "User not found"
    else if (err?.code === "auth/invalid-email") friendlyMessage = "Invalid email format"
    else if (err?.code === "auth/user-disabled") friendlyMessage = "User account is disabled"
    else if (err?.code === "user-not-found") friendlyMessage = "User record not found"
    else if (err?.code === "account-banned") friendlyMessage = err.message
    else if (err?.code === "account-suspended") friendlyMessage = err.message

    throw { code: err?.code || "login-error", message: friendlyMessage }
  }
}
