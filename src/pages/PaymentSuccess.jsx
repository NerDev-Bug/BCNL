import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { httpsCallable } from "firebase/functions"
import { functions, db } from "../firebase"
import { useCart } from "../context/CartContext"
import { doc, getDoc } from "firebase/firestore"
import { decreaseProductLimits } from "../utils/productLimits"
import { processOrderRewardPoints } from "../utils/rewardPoints"

// ✅ Cloud Function you create (recommended)
// It should verify Mollie payment/order status server-side.
const verifyPayment = httpsCallable(functions, "verifyMolliePayment")

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { clearCart } = useCart()

  // modal open
  const [open, setOpen] = useState(true)

  // status
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("checking") // checking | paid | pending | failed
  const [details, setDetails] = useState(null)
  const [error, setError] = useState("")

  // prevent double actions (refresh + rerender)
  const clearedRef = useRef(false)
  const limitsDecreasedRef = useRef(false)
  const pointsProcessedRef = useRef(false)
  
  // reward points
  const [pointsEarned, setPointsEarned] = useState(0)

  const orderId = params.get("orderId") || ""
  const paymentId = params.get("paymentId") || ""
  const source = useMemo(() => {
    if (orderId) return { type: "orderId", value: orderId }
    if (paymentId) return { type: "paymentId", value: paymentId }
    return { type: "none", value: "" }
  }, [orderId, paymentId])

  // close modal helper
  const closeAndGoHome = () => {
    setOpen(false)
    // Store points in localStorage for congrats modal to show on home/profile
    if (pointsEarned > 0) {
      localStorage.setItem("pendingRewardPoints", String(pointsEarned))
    }
    setTimeout(() => navigate("/"), 150)
  }

  const closeAndGoOrders = () => {
    setOpen(false)
    // Store points in localStorage for congrats modal to show on home/profile
    if (pointsEarned > 0) {
      localStorage.setItem("pendingRewardPoints", String(pointsEarned))
    }
    setTimeout(() => navigate("/profile"), 150) // adjust route if you have /orders
  }

  // ESC close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeAndGoHome()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let mounted = true

    const run = async () => {
      setLoading(true)
      setError("")
      setStatus("checking")

      try {
        // ✅ If no params provided, still show success UI, but can't verify
        if (source.type === "none") {
          if (!mounted) return
          setStatus("paid")
          setDetails({
            message: "Payment completed.",
            note: "No reference id found in URL, skipping verification.",
          })
          setLoading(false)

          // ✅ Clear cart once
          if (!clearedRef.current) {
            clearedRef.current = true
            clearCart?.()
          }
          return
        }

        // ✅ Verify server-side (recommended)
        // Your Cloud Function should return:
        // { status: "paid" | "pending" | "failed", orderId?, paymentId?, amount?, method?, createdAt? }
        const res = await verifyPayment({ orderId })
        const data = res?.data || {}

        if (!mounted) return

        const s = String(data.status || "").toLowerCase()

        if (s === "paid") {
          setStatus("paid")
          setDetails(data)
          toast.success("Payment verified ✅")

          // ✅ Clear cart once
          if (!clearedRef.current) {
            clearedRef.current = true
            clearCart?.()
          }

          // ✅ Decrease product limits once
          if (!limitsDecreasedRef.current && orderId) {
            limitsDecreasedRef.current = true
            try {
              const orderRef = doc(db, "orders", orderId)
              const orderSnap = await getDoc(orderRef)
              
              if (orderSnap.exists()) {
                const orderData = { id: orderSnap.id, ...orderSnap.data() }
                await decreaseProductLimits(orderData)
                console.log("✅ Product limits decreased for order:", orderId)
              }
            } catch (limitError) {
              console.error("Error decreasing product limits:", limitError)
              // Don't show error to user, just log it
            }
          }

          // ✅ Process reward points once
          if (!pointsProcessedRef.current && orderId) {
            pointsProcessedRef.current = true
            try {
              const orderRef = doc(db, "orders", orderId)
              const orderSnap = await getDoc(orderRef)
              
              if (orderSnap.exists()) {
                const orderData = { id: orderSnap.id, ...orderSnap.data() }
                const earned = await processOrderRewardPoints(orderData)
                if (earned > 0) {
                  setPointsEarned(earned)
                  console.log(`✅ Reward points processed: +${earned} points`)
                }
              }
            } catch (pointsError) {
              console.error("Error processing reward points:", pointsError)
              // Don't show error to user, just log it
            }
          }
        } else if (s === "pending" || s === "open") {
          setStatus("pending")
          setDetails(data)
          toast.info("Payment is still pending…")
        } else {
          setStatus("failed")
          setDetails(data)
          toast.error("Payment not completed.")
        }

        setLoading(false)
      } catch (err) {
        console.error("verifyPayment error:", err)
        if (!mounted) return
        setLoading(false)
        setStatus("failed")
        setError(
          err?.message ||
            "Could not verify payment. If you were charged, please contact support."
        )
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [source.type, source.value, orderId, clearCart])

  const title = useMemo(() => {
    if (loading) return "Checking your payment…"
    if (status === "paid") return "Payment Successful 🎉"
    if (status === "pending") return "Payment Pending ⏳"
    return "Payment Failed ❌"
  }, [loading, status])

  const subtitle = useMemo(() => {
    if (loading) return "Please wait while we confirm your payment."
    if (status === "paid") return "Thank you! Your order is being processed."
    if (status === "pending")
      return "Your payment is not confirmed yet. Please refresh later."
    return "We couldn’t confirm your payment."
  }, [loading, status])

  return (
    <>
      {/* background page (keeps it looking like a page but modal-centered) */}
      <div className="min-h-screen bg-gray-100" />

      {open && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeAndGoHome}
          />

          {/* modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-[520px] rounded-2xl bg-white shadow-2xl overflow-hidden">
              {/* header */}
              <div className="px-6 py-5 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                  </div>

                  <button
                    onClick={closeAndGoHome}
                    className="text-gray-500 hover:text-gray-800"
                    aria-label="Close"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* content */}
              <div className="px-6 py-5">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                    <p className="text-sm text-gray-700">
                      Verifying with server…
                    </p>
                  </div>
                ) : (
                  <>
                    {/* status box */}
                    <div
                      className={`rounded-xl p-4 text-sm ${
                        status === "paid"
                          ? "bg-green-50 text-green-800"
                          : status === "pending"
                          ? "bg-yellow-50 text-yellow-800"
                          : "bg-red-50 text-red-800"
                      }`}
                    >
                      {status === "paid" && (
                        <p>
                          ✅ Your payment was confirmed. We’ll start preparing
                          your order now.
                        </p>
                      )}

                      {status === "pending" && (
                        <p>
                          ⏳ Payment is still pending. If you just paid, wait a
                          moment then refresh this page.
                        </p>
                      )}

                      {status === "failed" && (
                        <p>
                          ❌ Payment not confirmed. If you think this is a
                          mistake, contact support with your reference below.
                        </p>
                      )}

                      {error ? <p className="mt-2">{error}</p> : null}
                    </div>

                    {/* details */}
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                      <Row label="Reference Type" value={source.type} />
                      <Row label="Reference ID" value={source.value || "—"} />

                      <Row
                        label="Order ID"
                        value={details?.orderId || orderId || "—"}
                      />
                      <Row
                        label="Payment ID"
                        value={details?.paymentId || paymentId || "—"}
                      />
                      <Row label="Method" value={details?.method || "—"} />
                      <Row
                        label="Amount"
                        value={
                          details?.amount
                            ? `${details.amount}`
                            : details?.amount?.value
                            ? `${details.amount.value} ${details.amount.currency || ""}`
                            : "—"
                        }
                      />
                    </div>

                    {/* actions */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      {status === "paid" ? (
                        <>
                          <button
                            onClick={closeAndGoHome}
                            className="w-full sm:w-auto flex-1 rounded-xl bg-purple-600 text-white px-4 py-2 font-medium hover:bg-purple-700"
                            type="button"
                          >
                            Back to Home
                          </button>

                          <button
                            onClick={closeAndGoOrders}
                            className="w-full sm:w-auto flex-1 rounded-xl bg-gray-100 text-gray-800 px-4 py-2 font-medium hover:bg-gray-200"
                            type="button"
                          >
                            View Profile / Orders
                          </button>
                        </>
                      ) : status === "pending" ? (
                        <>
                          <button
                            onClick={() => window.location.reload()}
                            className="w-full sm:w-auto flex-1 rounded-xl bg-yellow-500 text-white px-4 py-2 font-medium hover:bg-yellow-600"
                            type="button"
                          >
                            Refresh Status
                          </button>

                          <button
                            onClick={closeAndGoHome}
                            className="w-full sm:w-auto flex-1 rounded-xl bg-gray-100 text-gray-800 px-4 py-2 font-medium hover:bg-gray-200"
                            type="button"
                          >
                            Back to Home
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={closeAndGoHome}
                            className="w-full sm:w-auto flex-1 rounded-xl bg-gray-900 text-white px-4 py-2 font-medium hover:bg-black"
                            type="button"
                          >
                            Back to Home
                          </button>

                          <button
                            onClick={() => window.location.reload()}
                            className="w-full sm:w-auto flex-1 rounded-xl bg-gray-100 text-gray-800 px-4 py-2 font-medium hover:bg-gray-200"
                            type="button"
                          >
                            Try Again
                          </button>
                        </>
                      )}
                    </div>

                    {/* small note */}
                    <p className="mt-4 text-xs text-gray-500">
                      Tip: If you refresh and it stays pending, wait 1–2 minutes
                      then refresh again.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 break-all text-right">
        {value}
      </span>
    </div>
  )
}
