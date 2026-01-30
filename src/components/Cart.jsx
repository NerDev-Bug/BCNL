import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import { toast } from "react-toastify"
import { httpsCallable } from "firebase/functions"
import { functions, auth } from "../firebase"
import { useCart } from "../context/CartContext"
import CheckOutModal from "./modals/CheckOutModal"
import OrderConfirmation from "./modals/Payment"

// Callable cloud function for Mollie payment
const createMolliePayment = httpsCallable(functions, "createMolliePayment")

function Cart({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem }) {
  const { clearCart } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  // ✅ NEW: unavailable modal
  const [showUnavailableModal, setShowUnavailableModal] = useState(false)
  const [unavailableItems, setUnavailableItems] = useState([])

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  // ✅ helper: find unavailable items in cart
const getUnavailableItems = () =>
  (cartItems || []).filter((i) => i?.available === false)

  // ✅ called after checkout form is submitted
  const handleSaveOrder = (orderData) => {
    setPendingOrder(orderData)
    setShowCheckout(false)
    setShowConfirm(true)
  }

  // ✅ final confirm - creates Mollie payment and redirects
  const handleConfirmOrder = async (method) => {
    try {
      // SAFETY: re-check availability before payment
      const unavailable = getUnavailableItems()
      if (unavailable.length > 0) {
        setUnavailableItems(unavailable)
        setShowUnavailableModal(true)
        return
      }

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
        method,
        amount: totalPrice,
        orderId,
        items: cartItems.map((item) => ({
          cartItemId: item.id,
          productId: item.productId || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customization: item.customization || null,
        })),
        customer: pendingOrder,
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
      window.location.href = checkoutUrl
    } catch (err) {
      console.error("PAYMENT ERROR:", err)
      console.error("Error details:", {
        code: err?.code,
        message: err?.message,
        details: err?.details,
        stack: err?.stack,
      })

      let errorMessage = "Failed to start payment."

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

  // ✅ Checkout click handler (shows unavailable modal if needed)
  const handleCheckoutClick = () => {
    const unavailable = getUnavailableItems()
    if (unavailable.length > 0) {
      setUnavailableItems(unavailable)
      setShowUnavailableModal(true)
      return
    }
    setShowCheckout(true)
  }

  // ✅ Modal actions
  const handleRemoveUnavailableAndContinue = () => {
    unavailableItems.forEach((i) => {
      if (i?.id) onRemoveItem?.(i.id)
    })

    setShowUnavailableModal(false)
    setUnavailableItems([])
    toast.info("Unavailable item(s) removed. You can continue checkout.")

    // Open checkout after removing
    setShowCheckout(true)
  }

  const handleCancelUnavailableModal = () => {
    setShowUnavailableModal(false)
    setUnavailableItems([])
  }

  return (
    <>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />}

      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-white z-50 transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-[#7B2220]">Shopping cart</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-black">
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70%] text-center px-6">
            <ShoppingCart size={64} className="text-[#7B2220] opacity-60 mb-4" />

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

                    {item.available === false && (
                      <p className="text-xs font-semibold text-red-600">Not available today</p>
                    )}

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
              <p className="font-semibold text-lg text-[#502455]">Total: €{totalPrice}</p>

              <button
                onClick={handleCheckoutClick}
                className="bg-[#7B2220] text-white px-3 py-1.5 rounded-md hover:bg-[#502455] transition text-sm"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>

      {/* ✅ UNAVAILABLE MODAL */}
      {showUnavailableModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[80]"
            onClick={handleCancelUnavailableModal}
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl border border-[#7B2220] overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#7B2220]">Unavailable items</h3>
                <button
                  onClick={handleCancelUnavailableModal}
                  className="text-2xl text-gray-500 hover:text-black"
                >
                  ×
                </button>
              </div>

              <div className="p-5">
                <p className="text-gray-700">
                  The following item{unavailableItems.length > 1 ? "s are" : " is"} not available
                  today. Remove {unavailableItems.length > 1 ? "them" : "it"} to continue checkout?
                </p>

                <div className="mt-4 space-y-2">
                  {unavailableItems.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between border rounded-md px-3 py-2"
                    >
                      <span className="font-semibold text-[#502455]">{it.name}</span>
                      <span className="text-sm font-semibold text-red-600">Not available</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleCancelUnavailableModal}
                    className="flex-1 rounded-md py-2 font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleRemoveUnavailableAndContinue}
                    className="flex-1 rounded-md py-2 font-semibold bg-[#7B2220] text-white hover:bg-[#502455]"
                  >
                    Remove & Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
