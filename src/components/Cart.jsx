import {  useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-toastify"
import { httpsCallable } from "firebase/functions"
import { functions, auth } from "../firebase"
import { useCart } from "../context/CartContext"
import CheckOutModal from "./modals/CheckOutModal";
import OrderConfirmation from "./modals/Payment"

// Callable cloud function for Mollie payment
const createMolliePayment = httpsCallable(functions, "createMolliePayment")

function Cart({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem }) {
  const { clearCart } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [loadingPayment, setLoadingPayment] = useState(false)
  

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  // ✅ called after checkout form is submitted
  const handleSaveOrder = (orderData) => {
    setPendingOrder(orderData)   // store checkout info (name/address/etc)
    setShowCheckout(false)       // close checkout modal
    setShowConfirm(true)         // open payment method selection modal
  }

  // ✅ final confirm - creates Mollie payment and redirects
  const handleConfirmOrder = async (method) => {
    try {
      const user = auth.currentUser
      if (!user) {
        toast.error("Please login first.")
        return
      }

      if (!pendingOrder || !method) {
        toast.error("Please select a payment method.")
        return
      }

      if (cartItems.length === 0) {
        toast.error("Cart is empty.")
        return
      }

      setLoadingPayment(true)

      // Generate orderId
      const orderId = crypto.randomUUID()

      // Call Mollie payment function
      const result = await createMolliePayment({
        method,                    // "ideal" or "paypal"
        amount: totalPrice,        // number
        orderId,
        items: cartItems.map((item) => ({
          cartItemId: item.id,
          productId: item.productId || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customization: item.customization || null,
        })),
        customer: pendingOrder,    // customer info (name, address, etc)
      })

      const checkoutUrl = result?.data?.checkoutUrl
      if (!checkoutUrl) {
        toast.error("No checkout URL returned from Mollie.")
        setLoadingPayment(false)
        return
      }

      // Clear cart before redirect (order is already saved by backend)
      await clearCart()

      toast.success("Redirecting to payment...")
      
      // Redirect to Mollie hosted checkout
      window.location.href = checkoutUrl
    } catch (err) {
      console.error("PAYMENT ERROR:", err)
      console.error("Error details:", {
        code: err?.code,
        message: err?.message,
        details: err?.details,
        stack: err?.stack
      })
      
      // Extract error message from Firebase error
      let errorMessage = "Failed to start payment."
      
      // Firebase Functions v2 callable errors
      if (err?.details) {
        errorMessage = err.details.message || err.message || errorMessage
      } else if (err?.message) {
        errorMessage = err.message
      } else if (err?.code) {
        errorMessage = `Error ${err.code}: ${err.message || "Unknown error"}`
      }
      
      toast.error(errorMessage)
      setLoadingPayment(false)
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
        onClose={() => {
          if (!loadingPayment) {
            setShowConfirm(false)
            setPendingOrder(null)
          }
        }}
        cartItems={cartItems}
        totalPrice={totalPrice}
        onConfirm={handleConfirmOrder}
        loading={loadingPayment}
      />
    </>
  )
}

export default Cart
