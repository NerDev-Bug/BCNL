// /modals/Payment.jsx
import React, { useMemo, useState } from "react"

export default function Payment({
  isOpen,
  onClose,
  cartItems = [],
  totalPrice = 0,
  onConfirm,
  loading = false,
}) {
  const [method, setMethod] = useState("ideal")
  const isEmpty = cartItems.length === 0
  const formattedTotal = useMemo(() => {
    const n = Number(totalPrice || 0)
    return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)
  }, [totalPrice])

  if (!isOpen) return null

  const handleContinue = () => {
    if (isEmpty || loading) return
    onConfirm?.(method)
  }

  return (
    <>
      {/* overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50" />

      {/* modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-0">
        <div className="w-full max-w-[740px] overflow-hidden shadow-2xl">
          {/* background image container */}
          <div
            className="relative w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/images/payment_bg.png')" }}
          >
            {/* top bar */}
            <div className="relative flex items-start justify-between p-5">
              {/* logo ONLY */}
              <img
                src="/images/bcnl_logo.png"
                alt="BakeCorner"
                className="h-12 object-contain"
              />

              {/* close */}
              <button
                onClick={onClose}
                className="text-black hover:text-white text-4xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* content */}
            <div className="relative px-6 pb-8">
              {/* Total */}
              <div className="-mx-6 bg-white py-4 text-center">
                <p className="text-[#7B2220] font-extrabold text-2xl">
                  Total: €{formattedTotal}
                </p>
              </div>

              {/* title */}
              <div className="mt-4 flex items-center gap-3 text-white">
                <div className="h-[2px] flex-1 bg-white/35" />
                <p className="font-extrabold tracking-wide">
                  Select Payment Method
                </p>
                <div className="h-[2px] flex-1 bg-white/35" />
              </div>

              {/* methods */}
              <div className="mt-8 space-y-5">
                {/* iDEAL */}
                <button
                  type="button"
                  onClick={() => setMethod("ideal")}
                  disabled={isEmpty}
                  className={[
                    "mx-auto w-full max-w-[420px] bg-white rounded-xl px-6 py-4 shadow-md",
                    "flex items-center justify-center gap-3",
                    "transition",
                    method === "ideal"
                      ? "ring-2 ring-[#7B2220]/70"
                      : "hover:ring-2 hover:ring-white/70",
                    isEmpty ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <img
                    src="/images/iDeal_logo.png"
                    alt="iDEAL"
                    className="h-7 w-auto"
                  />
                  <span className="text-[#7B2220] font-bold text-base">
                    iDEAL
                  </span>
                </button>
              </div>

              {/* continue */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleContinue}
                  disabled={isEmpty || !method || loading}
                  className={[
                    "w-full max-w-[360px] rounded-xl py-3 text-white font-extrabold text-base",
                    "bg-[#7B2220] shadow",
                    "hover:bg-[#5b1a18] transition",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                  ].join(" ")}
                >
                  {loading ? "Processing..." : "Continue to Payment"}
                </button>
              </div>

              {isEmpty && (
                <p className="mt-4 text-center text-white/80 text-sm">
                  Your cart is empty.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
