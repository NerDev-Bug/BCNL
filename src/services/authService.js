// src/services/authService.js
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * REGISTER user
 * @param {string} email
 * @param {string} password
 * @param {string} username
 * @returns {Promise<User>}
 */
export const registerUser = async (email, password, username) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user info in Firestore with role
    await setDoc(doc(db, "users", user.uid), {
      username,
      email: user.email,
      role: "customer",
      createdAt: serverTimestamp(),
    });

    return user;
  } catch (err) {
    // Map Firebase registration errors
    let friendlyMessage = err.message;

    if (err.code === "auth/email-already-in-use") {
      friendlyMessage = "Email is already registered";
    } else if (err.code === "auth/invalid-email") {
      friendlyMessage = "Invalid email format";
    } else if (err.code === "auth/weak-password") {
      friendlyMessage = "Password is too weak (min 6 characters)";
    }

    throw { code: err.code || "register-error", message: friendlyMessage };
  }
};

/**
 * LOGIN user with role
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: User, role: string}>}
 */
export const loginUser = async (email, password) => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw { code: "user-not-found", message: "User record not found" };
    }

    return {
      user,
      role: userDoc.data().role,
    };
  } catch (err) {
    // Map Firebase login errors to friendly messages
    let friendlyMessage = err.message;

    if (err.code === "auth/wrong-password") {
      friendlyMessage = "Wrong password";
    } else if (err.code === "auth/user-not-found") {
      friendlyMessage = "User not found";
    } else if (err.code === "auth/invalid-email") {
      friendlyMessage = "Invalid email format";
    } else if (err.code === "auth/user-disabled") {
      friendlyMessage = "User account is disabled";
    }

    throw { code: err.code || "login-error", message: friendlyMessage };
  }
};
