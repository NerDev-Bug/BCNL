import {  useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-toastify"
import { useCart } from "../context/CartContext"
import CheckOutModal from "./modals/CheckOutModal";
import OrderConfirmation from "./modals/Payment"

function Cart({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem }) {
  const { createOrder } = useCart() // ✅ NEW
  const [showCheckout, setShowCheckout] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false) // ✅ added
  const [pendingOrder, setPendingOrder] = useState(null) // ✅ added
  

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  // ✅ called after checkout form is submitted
  const handleSaveOrder = (orderData) => {
    setPendingOrder(orderData)   // store checkout info (name/address/etc)
    setShowCheckout(false)       // close checkout modal
    setShowConfirm(true)         // open confirmation modal
  }

  // ✅ final confirm
  const handleConfirmOrder = async () => {
  try {
    await createOrder(pendingOrder)

    toast.success("Order placed successfully!")
    setShowConfirm(false)
    setPendingOrder(null)
    onClose?.()
  } catch (err) {
    console.error("ORDER ERROR:", err)
    toast.error("Failed to place order")
  }
}


  const handleQuantityChange = (id, value) => {
    if (value < 1) return
    onUpdateQuantity?.(id, value)
  }

  const handleRemove = (id) => {
    onRemoveItem?.(id)
  }

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-white z-50 transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-[#7B2220]">Shopping cart</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-black"
          >
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70%] text-center px-6">
            <ShoppingCart
              size={64}
              className="text-[#7B2220] opacity-60 mb-4"
            />

            <p className="text-[#7B2220] text-lg font-semibold mb-6">
              Your cart is empty.
            </p>

            <button
              onClick={onClose}
              className="bg-[#7B2220] text-white px-6 py-3 rounded-md hover:opacity-90 transition"
            >
              Return to Shop
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto h-[calc(100%-80px)] p-5 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[#502455]">{item.name}</p>
                    <p className="text-gray-600">
                      €{item.price} x{" "}
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value))
                        }
                        className="w-14 text-center border rounded-md px-1 py-0.5"
                      />
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#7B2220]">
                      €{item.price * item.quantity}
                    </p>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-600 hover:text-red-800 font-semibold px-2 py-1 border border-red-300 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 right-0 w-[380px] bg-white border-t p-5 flex items-center justify-between shadow-lg z-50">
              <p className="font-semibold text-lg text-[#502455]">
                Total: €{totalPrice}
              </p>

              <button
                onClick={() => setShowCheckout(true)}
                className="bg-[#7B2220] text-white px-3 py-1.5 rounded-md hover:bg-[#502455] transition text-sm"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>

      <CheckOutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={cartItems}
        totalPrice={totalPrice}
        onSaveOrder={handleSaveOrder}
      />

      <OrderConfirmation
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        cartItems={cartItems}
        totalPrice={totalPrice}
        onConfirm={handleConfirmOrder}
      />
    </>
  )
}

export default Cart
