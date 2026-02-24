// /modals/Payment.jsx
import { useMemo, useState } from "react"

function Payment({
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
    return Number(totalPrice || 0).toFixed(2)
  }, [totalPrice])

  if (!isOpen) return null

  const handleContinue = () => {
    if (isEmpty || loading) return
    onConfirm?.(method)
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-6 space-y-6">

          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#7B2220]">
              Payment
            </h2>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* Payment Method */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-sm">
              Select Payment Method
            </h3>

            <div className="space-y-3">

              {/* iDEAL */}
              <label className="flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer hover:border-[#7B2220] transition">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={method === "ideal"}
                    onChange={() => setMethod("ideal")}
                  />
                  <span className="text-sm font-medium">
                    iDEAL
                  </span>
                </div>

                <img
                  src="/images/iDeal_logo.png"
                  alt="iDEAL"
                  className="h-6"
                />
              </label>

            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm">
              Order Summary
            </h3>

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm text-gray-600"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>
                  €{(Number(item.price || 0) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total</span>
              <span>€{formattedTotal}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="w-1/3 border rounded-lg py-3 text-sm"
            >
              Cancel
            </button>

            <button
              onClick={handleContinue}
              disabled={isEmpty || loading}
              className="w-2/3 bg-[#7B2220] text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </button>
          </div>

          {isEmpty && (
            <p className="text-center text-sm text-gray-500">
              Your cart is empty.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default Payment