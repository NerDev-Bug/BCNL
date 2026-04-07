/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";

function MonthlyRatingModal() {
  const getMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userCreatedAt, setUserCreatedAt] = useState(null);

  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u?.uid || null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // ✅ USER CREATION DATE
  useEffect(() => {
    if (!userId) return;

    const fetchUserCreationDate = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const createdAt = userDoc.data().createdAt?.toDate() || null;
          setUserCreatedAt(createdAt);
        }
      } catch (err) {
        console.error("Error fetching user creation date:", err);
      }
    };

    fetchUserCreationDate();
  }, [userId]);

  // ✅ Determine if modal should show
  const shouldShowModal = () => {
    if (typeof window === "undefined") return false;
    if (!userId) return false;

    const monthKey = getMonthKey();
    const alreadyRated = localStorage.getItem(`rating-${monthKey}`);
    if (alreadyRated) return false;

    // Handle "maybe later"
    const maybeLaterData = localStorage.getItem(`rating-maybe-later-${monthKey}`);
    if (maybeLaterData) {
      let lastDismissed = 0, hoursToWait = 4;
      try {
        const parsed = JSON.parse(maybeLaterData);
        lastDismissed = parsed.timestamp || 0;
        hoursToWait = parsed.hoursToWait || 4;
      } catch {
        lastDismissed = parseInt(maybeLaterData, 10) || 0;
      }
      const timeSinceDismissed = Date.now() - lastDismissed;
      const millisecondsToWait = hoursToWait * 60 * 60 * 1000;
      if (timeSinceDismissed < millisecondsToWait) return false;
    }

    // ✅ If userCreatedAt exists, only show after 1 month
    if (userCreatedAt) {
      const now = new Date();
      const oneMonthLater = new Date(userCreatedAt);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      if (now < oneMonthLater) return false;
    } else {
      // If missing (old users), assume eligible
      console.warn("User has no creation date, assuming eligible to show rating modal.");
    }

    return true;
  };

  // ✅ Show control
  useEffect(() => {
    if (!authChecked) return;
    setShow(shouldShowModal());
  }, [authChecked, userId, userCreatedAt]);

  // ✅ Firestore dedup check
  useEffect(() => {
    if (!userId || !show) return;

    const monthKey = getMonthKey();
    getDoc(doc(db, "ratings_by_user", `${userId}_${monthKey}`))
      .then((snap) => {
        if (snap.exists()) {
          localStorage.setItem(`rating-${monthKey}`, "true");
          setVisible(false);
          setShow(false);
        }
      })
      .catch((err) => console.error(err));
  }, [userId, show]);

  // ✅ Animation
  useEffect(() => {
    if (show) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [show]);

  const submitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      const monthKey = getMonthKey();
      const dedupRef = doc(db, "ratings_by_user", `${userId}_${monthKey}`);
      const existing = await getDoc(dedupRef);

      if (existing.exists()) {
        localStorage.setItem(`rating-${monthKey}`, "true");
        toast.info("You have already rated this month. Thank you! 😊");
        setVisible(false);
        setTimeout(() => setShow(false), 300);
        return;
      }

      await setDoc(dedupRef, { userId, monthKey, submittedAt: serverTimestamp() });
      await addDoc(collection(db, "ratings"), {
        rating,
        comment: comment.trim() || null,
        monthKey,
        userId,
        createdAt: serverTimestamp(),
      });

      localStorage.setItem(`rating-${monthKey}`, "true");
      toast.success("Thank you for your feedback! 💝");

      setVisible(false);
      setTimeout(() => setShow(false), 300);
    } catch (err) {
      console.error(err);
      toast.error("Error submitting rating.");
      setSubmitting(false);
    }
  };

  const handleMaybeLater = () => {
    const monthKey = getMonthKey();
    const delayData = { timestamp: Date.now(), hoursToWait: 3 + Math.random() * 2 };
    localStorage.setItem(`rating-maybe-later-${monthKey}`, JSON.stringify(delayData));
    setVisible(false);
    setTimeout(() => setShow(false), 300);
    toast.info("We'll ask again later 😊");
  };

  if (!authChecked || !userId || !show) return null;

  const ratingLabels = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } bg-black/60 backdrop-blur-sm`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7B2220] to-[#502455] rounded-t-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-3">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Rate Your Experience</h2>
          <p className="text-white/90 text-sm">Help us improve by sharing your feedback</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
              How would you rate our website?
            </label>
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <svg
                    className={`w-12 h-12 transition-all duration-200 ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 fill-gray-300"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-medium text-[#7B2220] mt-2">{ratingLabels[rating]}</p>
            )}
          </div>

          {/* Comment Textarea */}
          <div className="mb-6">
            <label htmlFor="rating-comment" className="block text-sm font-semibold text-gray-700 mb-2">
              Share your thoughts (optional)
            </label>
            <textarea
              id="rating-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think... What did you like? What can we improve?"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B2220] focus:border-transparent resize-none transition-all duration-200"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">Your feedback helps us serve you better</p>
              <p className="text-xs text-gray-400">{comment.length}/500</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleMaybeLater}
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Maybe Later
            </button>
            <button
              type="button"
              onClick={submitRating}
              disabled={rating === 0 || submitting}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-[#7B2220] to-[#502455] text-white font-semibold hover:from-[#8B3230] hover:to-[#602465] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyRatingModal;
