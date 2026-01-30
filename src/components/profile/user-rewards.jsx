import { useEffect, useMemo, useState } from "react"
import { db } from "../../firebase"
import { doc, getDoc } from "firebase/firestore"

export default function UserRewards({ user }) {
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, "users", user.uid)
        const snap = await getDoc(ref)
        const data = snap.exists() ? snap.data() : {}
        setPoints(Number(data?.points || 0))
      } catch (e) {
        console.error("Failed to load points:", e)
        setPoints(0)
      } finally {
        setLoading(false)
      }
    }

    if (user?.uid) load()
  }, [user?.uid])

  const tier = useMemo(() => {
    if (points >= 2000) return "Gold"
    if (points >= 1000) return "Silver"
    if (points >= 300) return "Bronze"
    return "Starter"
  }, [points])

  // ✅ EURO rewards (edit amounts however you like)
  const rewards = useMemo(
    () => [
      { name: "€0.40 OFF Voucher", need: 300 },
      { name: "€0.60 OFF Voucher", need: 700 },
      { name: "Free Delivery", need: 1000 },
      { name: "€2.00 OFF Voucher", need: 1500 },
    ],
    []
  )

  if (loading) {
    return <div className="text-gray-500">Loading rewards...</div>
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Points & Rewards</h2>

      {/* Points Card */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Your Points</p>
            <p className="text-3xl font-bold text-[#7B2220]">{points}</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Tier</p>
            <p className="text-lg font-semibold">{tier}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Tip: Earn points every time you purchase. Redeem rewards when you have enough points.
        </p>
      </div>

      {/* Rewards List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 font-semibold">Available Rewards</div>

        <div className="divide-y">
          {rewards.map((r) => {
            const canRedeem = points >= r.need
            return (
              <div key={r.name} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-sm text-gray-500">Needs {r.need} points</p>
                </div>

                <button
                  disabled={!canRedeem}
                  className={`px-4 py-2 rounded font-semibold ${
                    canRedeem
                      ? "bg-[#7B2220] text-white hover:opacity-90"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Redeem
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
