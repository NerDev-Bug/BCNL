import { useEffect, useMemo, useState } from "react"
import { db } from "../../firebase"
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { toast } from "react-toastify"

export default function UserRewards({ user }) {
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState(0)
  const [redeeming, setRedeeming] = useState(null) // reward name currently being redeemed
  const [redeemModal, setRedeemModal] = useState(null) // reward to confirm

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

  const rewards = useMemo(
    () => [
      { name: "€0.40 OFF Voucher", need: 300 },
      { name: "€0.60 OFF Voucher", need: 700 },
      { name: "€2.00 OFF Voucher", need: 1500 },
    ],
    []
  )

  const handleRedeem = async (reward) => {
    if (redeeming) return
    setRedeemModal(null)
    setRedeeming(reward.name)

    try {
      const userRef = doc(db, "users", user.uid)
      // Re-read points to prevent race conditions
      const snap = await getDoc(userRef)
      const currentPoints = Number(snap.data()?.points || 0)

      if (currentPoints < reward.need) {
        toast.error("Not enough points to redeem this reward.")
        setPoints(currentPoints)
        return
      }

      const newPoints = currentPoints - reward.need

      // Deduct points
      await updateDoc(userRef, { points: newPoints })

      // Save voucher/redemption record
      await addDoc(collection(db, "users", user.uid, "redemptions"), {
        reward: reward.name,
        pointsSpent: reward.need,
        redeemedAt: serverTimestamp(),
        status: "active",
      })

      setPoints(newPoints)
      toast.success(`🎉 Redeemed "${reward.name}"! Check your vouchers.`)
    } catch (err) {
      console.error("Redeem failed:", err)
      toast.error("Failed to redeem reward. Please try again.")
    } finally {
      setRedeeming(null)
    }
  }

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
            const isRedeeming = redeeming === r.name
            return (
              <div key={r.name} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-sm text-gray-500">Needs {r.need} points</p>
                </div>

                <button
                  disabled={!canRedeem || !!redeeming}
                  onClick={() => setRedeemModal(r)}
                  className={`px-4 py-2 rounded font-semibold transition-all ${
                    canRedeem && !redeeming
                      ? "bg-[#7B2220] text-white hover:opacity-90"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isRedeeming ? "Redeeming..." : "Redeem"}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Confirm Redeem Modal */}
      {redeemModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setRedeemModal(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Redemption</h3>
              <p className="text-sm text-gray-600 mb-1">
                Redeem <strong>{redeemModal.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-5">
                This will deduct <strong>{redeemModal.need} points</strong> from your balance. You currently have <strong>{points} points</strong>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRedeemModal(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRedeem(redeemModal)}
                  className="flex-1 px-4 py-2 rounded-xl bg-[#7B2220] text-white text-sm font-semibold hover:bg-[#8B3230]"
                >
                  Yes, Redeem
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
