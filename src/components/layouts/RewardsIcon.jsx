import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebase"

function RewardsIcon() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)

  const [loadingPoints, setLoadingPoints] = useState(false)
  const [points, setPoints] = useState(0)

  const navigate = useNavigate()

  // ✅ listen auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return () => unsub()
  }, [])

  // ✅ load points when popup opens
  useEffect(() => {
    const loadPoints = async () => {
      if (!open) return

      if (!user) {
        setPoints(0)
        return
      }

      setLoadingPoints(true)
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const p = Number(snap.data()?.points || 0)
        setPoints(p)
      } catch (e) {
        console.error("Failed to load points:", e)
        setPoints(0)
      } finally {
        setLoadingPoints(false)
      }
    }

    loadPoints()
  }, [open, user])

  // ✅ tiers / status
  const tiers = useMemo(
    () => [
      { name: "Bronze", min: 0, next: 100 },
      { name: "Silver", min: 100, next: 300 },
      { name: "Gold", min: 300, next: 600 },
      { name: "Platinum", min: 600, next: 1000 },
    ],
    []
  )

  const tier = useMemo(() => {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (points >= tiers[i].min) return tiers[i]
    }
    return tiers[0]
  }, [points, tiers])

  const nextTarget = tier?.next ?? 100
  const currentMin = tier?.min ?? 0
  const inThisTier = Math.max(0, points - currentMin)
  const tierRange = Math.max(1, nextTarget - currentMin)
  const progressPct = Math.min(100, Math.round((inThisTier / tierRange) * 100))
  const pointsToNext = Math.max(0, nextTarget - points)

  return (
    <>
      {/* ✅ CLICK-OUTSIDE OVERLAY (only when popup is open) */}
      {open && (
        <div
          className="fixed inset-0 z-[25]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FLOATING WRAPPER (LEFT SIDE) */}
      <div className="group fixed bottom-6 left-6 z-[30] flex items-center gap-3">
        {/* FLOATING BUTTON */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Open rewards"
          className="bg-[#5B1E5D] w-16 h-16 rounded-full shadow-lg hover:scale-110 transition flex items-center justify-center"
        >
          <img src="/images/giftbox.png" alt="Rewards" className="w-8 h-8" />
        </button>

        {/* PILL TOOLTIP (HOVER ONLY) */}
        {!open && (
          <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition bg-white text-gray-700 text-sm px-5 py-3 rounded-xl shadow-lg pointer-events-none">
            Rewards?{" "}
            <span className="font-semibold ml-1 text-gray-900">View points</span>
          </div>
        )}
      </div>

      {/* POPUP */}
      {open && (
        <div
          className="fixed bottom-24 left-6 w-80 bg-white rounded-lg shadow-2xl z-[30] overflow-hidden animate-fadeIn"
          onClick={(e) => e.stopPropagation()} // ✅ prevent closing when clicking inside
        >
          {/* HEADER */}
          <div className="bg-[#5B1E5D] text-white px-4 py-3 relative">
            <p className="font-semibold text-sm">Rewards</p>
            <p className="text-xs opacity-90">Your points & status</p>

            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-white text-lg"
              aria-label="Close rewards"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="px-4 py-4">
            {!user ? (
              <div className="text-sm text-gray-700">
                Please log in to see your rewards.
                <button
                  onClick={() => {
                    setOpen(false)
                    navigate("/profile")
                  }}
                  className="mt-3 w-full bg-[#5B1E5D] text-white text-sm font-semibold py-2 rounded-lg hover:opacity-95 transition"
                >
                  Log in or Sign up
                </button>
              </div>
            ) : (
              <>
                {/* POINTS + STATUS */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Points</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loadingPoints ? "…" : points}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {tier?.name || "Bronze"}
                    </p>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{tier?.name || "Bronze"}</span>
                    <span>{loadingPoints ? "Loading..." : `${progressPct}%`}</span>
                  </div>

                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-[#5B1E5D] rounded-full transition-all"
                      style={{ width: `${loadingPoints ? 10 : progressPct}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {loadingPoints
                      ? "Fetching your points…"
                      : pointsToNext === 0
                      ? "You reached the next tier!"
                      : `${pointsToNext} points to reach next tier.`}
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    setOpen(false)
                    navigate("/profile?tab=rewards")
                  }}
                  className="mt-4 flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-100 transition text-left rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-[#5B1E5D] flex items-center justify-center">
                    <img src="/images/giftbox.png" alt="Rewards" className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">Go to My Rewards</p>
                    <p className="text-xs text-gray-500">See rewards, history, and perks</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default RewardsIcon
