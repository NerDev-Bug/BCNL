import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"

export default function CongratsModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)

  useEffect(() => {
    // Check localStorage for pending reward points
    const storedPoints = localStorage.getItem("pendingRewardPoints")
    
    if (storedPoints) {
      const points = parseInt(storedPoints, 10)
      if (points > 0) {
        setPointsEarned(points)
        // Small delay to ensure component is mounted before showing
        setTimeout(() => setIsVisible(true), 100)
      }
    }
  }, [])

  const handleClose = (navigateTo) => {
    // Fade out animation
    setIsVisible(false)
    
    // Clear localStorage
    localStorage.removeItem("pendingRewardPoints")
    
    // Navigate only if not already on the target page
    setTimeout(() => {
      if (navigateTo === "home" && location.pathname !== "/") {
        navigate("/")
      } else if (navigateTo === "profile" && location.pathname !== "/profile") {
        navigate("/profile")
      }
    }, 300) // Match fade-out duration
  }

  const handleOverlayClick = () => {
    handleClose("home")
  }

  if (!pointsEarned) return null

  return (
    <>
      {/* Overlay with fade effect */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
      />

      {/* Modal with fade and scale effect */}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none ${
          isVisible ? "pointer-events-auto" : ""
        }`}
      >
        <div
          className={`w-full max-w-[480px] rounded-2xl bg-white shadow-2xl overflow-hidden transition-all duration-300 ${
            isVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b bg-gradient-to-r from-[#7B2220] to-[#8B3230]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">🎉 Congratulations!</h2>
                <p className="text-sm text-white/90 mt-1">You've earned reward points!</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 animate-bounce">
                <span className="text-5xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                You earned {pointsEarned} reward points!
              </h3>
              <p className="text-sm text-gray-600">
                Your points have been added to your account. Check your profile to see your total points and available rewards.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleClose("home")}
                className="w-full sm:w-auto flex-1 rounded-xl bg-[#7B2220] text-white px-4 py-3 font-medium hover:bg-[#8B3230] transition-colors"
                type="button"
              >
                Back to Home
              </button>

              <button
                onClick={() => handleClose("profile")}
                className="w-full sm:w-auto flex-1 rounded-xl bg-gray-100 text-gray-800 px-4 py-3 font-medium hover:bg-gray-200 transition-colors"
                type="button"
              >
                View Profile / Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
