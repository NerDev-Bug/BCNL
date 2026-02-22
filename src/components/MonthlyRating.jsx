import { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";

function MonthlyRatingModal() {
  const getMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  // Check if enough time has passed since "Maybe Later" was clicked
  const shouldShowModal = () => {
    if (typeof window === "undefined") return false;
    
    const monthKey = getMonthKey();
    const alreadyRated = localStorage.getItem(`rating-${monthKey}`);
    
    // If already rated this month, don't show
    if (alreadyRated) return false;
    
    // Check if "Maybe Later" was clicked and if enough time has passed
    const maybeLaterData = localStorage.getItem(`rating-maybe-later-${monthKey}`);
    
    if (!maybeLaterData) {
      // No "Maybe Later" clicked, show the modal
      return true;
    }
    
    // Parse the stored data (could be old format timestamp or new format object)
    let lastDismissed, hoursToWait;
    try {
      const parsed = JSON.parse(maybeLaterData);
      // New format: { timestamp, hoursToWait }
      lastDismissed = parsed.timestamp;
      hoursToWait = parsed.hoursToWait || 4; // Default to 4 if not found
    } catch {
      // Old format: just timestamp string
      lastDismissed = parseInt(maybeLaterData, 10);
      hoursToWait = 4; // Default to 4 hours for old format
    }
    
    // Calculate time difference
    const millisecondsToWait = hoursToWait * 60 * 60 * 1000;
    const timeSinceDismissed = typeof window !== "undefined" ? Date.now() - lastDismissed : 0;
    
    // Show modal if enough time has passed
    return timeSinceDismissed >= millisecondsToWait;
  };

  const [show, setShow] = useState(() => shouldShowModal());
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  // Listen to auth to get userId for Firestore dedup
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u?.uid || null));
    return () => unsub();
  }, []);

  // If logged in, also check Firestore for already-rated-this-month
  useEffect(() => {
    if (!userId || !show) return;
    const monthKey = getMonthKey();
    getDoc(doc(db, "ratings_by_user", `${userId}_${monthKey}`)).then((snap) => {
      if (snap.exists()) {
        // Already rated this month in Firestore — hide modal and update localStorage
        localStorage.setItem(`rating-${monthKey}`, "true");
        setVisible(false);
        setShow(false);
      }
    }).catch(() => {});
  }, [userId, show]);

  useEffect(() => {
    if (show) {
      // Trigger fade-in animation after mount
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
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

      // If logged in, check Firestore dedup before submitting
      if (userId) {
        const dedupRef = doc(db, "ratings_by_user", `${userId}_${monthKey}`);
        const existing = await getDoc(dedupRef);
        if (existing.exists()) {
          localStorage.setItem(`rating-${monthKey}`, "true");
          toast.info("You have already rated this month. Thank you! 😊");
          setVisible(false);
          setTimeout(() => setShow(false), 300);
          return;
        }
        // Write dedup record atomically with the rating
        await setDoc(dedupRef, { userId, monthKey, submittedAt: serverTimestamp() });
      }

      await addDoc(collection(db, "ratings"), {
        rating,
        comment: comment.trim() || null,
        monthKey,
        userId: userId || null,
        createdAt: serverTimestamp(),
      });
      localStorage.setItem(`rating-${monthKey}`, "true");
      toast.success("Thank you for your feedback! 💝");
      
      // Fade out animation
      setVisible(false);
      setTimeout(() => {
        setShow(false);
      }, 300);
    } catch (error) {
      console.error(error);
      toast.error("Error submitting rating. Please try again.");
      setSubmitting(false);
    }
  };

  const handleMaybeLater = () => {
    // Save current timestamp to localStorage with random delay (3-5 hours)
    const monthKey = getMonthKey();
    const timestamp = Date.now();
    
    // Randomize between 3-5 hours (in milliseconds)
    const minHours = 3;
    const maxHours = 5;
    const randomHours = minHours + Math.random() * (maxHours - minHours);
    const delayData = {
      timestamp: timestamp,
      hoursToWait: randomHours
    };
    
    localStorage.setItem(`rating-maybe-later-${monthKey}`, JSON.stringify(delayData));
    
    // Close the modal
    setVisible(false);
    setTimeout(() => {
      setShow(false);
    }, 300);
    
    toast.info("We'll ask again later. Thank you! 😊");
  };

  if (!show) return null;

  const ratingLabels = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

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
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Rate Your Experience
          </h2>
          <p className="text-white/90 text-sm">
            Help us improve by sharing your feedback
          </p>
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
              <p className="text-center text-sm font-medium text-[#7B2220] mt-2">
                {ratingLabels[rating]}
              </p>
            )}
          </div>

          {/* Comment Textarea */}
          <div className="mb-6">
            <label
              htmlFor="rating-comment"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
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
              <p className="text-xs text-gray-500">
                Your feedback helps us serve you better
              </p>
              <p className="text-xs text-gray-400">
                {comment.length}/500
              </p>
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
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Rating"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyRatingModal;
