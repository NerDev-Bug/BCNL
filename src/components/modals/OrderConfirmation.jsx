// /modals/OrderConfirmation.jsx
import React from "react"

export default function OrderConfirmation({
  isOpen,
  onClose,
  cartItems = [],
  totalPrice = 0,
  onConfirm,
}) {
  if (!isOpen) return null

  return (
    <>
      {/* overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50" />

      {/* modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-semibold text-[#7B2220]">
              Order Confirmation
            </h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-500 hover:text-black"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* body */}
          <div className="p-5">
            {cartItems.length === 0 ? (
              <p className="text-gray-600">Your cart is empty.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Please review your order before confirming:
                </p>

                <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between"
                    >
                      <div className="pr-3">
                        <p className="font-semibold text-[#502455]">
                          {item.name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          €{item.price} x {item.quantity}
                        </p>
                      </div>

                      <p className="font-semibold text-[#7B2220] whitespace-nowrap">
                        €{item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="font-semibold text-[#502455]">Total</p>
                  <p className="font-semibold text-lg text-[#502455]">
                    €{totalPrice}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* footer */}
          <div className="p-5 border-t flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={() => onConfirm?.()}
              disabled={cartItems.length === 0}
              className="bg-[#7B2220] text-white px-4 py-2 rounded-md hover:bg-[#502455] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
