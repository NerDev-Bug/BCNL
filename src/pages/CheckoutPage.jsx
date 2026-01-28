import { useMemo, useState } from "react"
import { httpsCallable } from "firebase/functions"
import { functions, auth } from "../firebase"
import Payment from "../modals/Payment"

// Callable cloud function name MUST match your deployed function
const createMolliePayment = httpsCallable(functions, "createMolliePayment")

export default function CheckoutPage() {
  // ✅ Example cart data (replace with your real cartItems)
  const [cartItems, setCartItems] = useState([
    // { id: "p1", name: "Cake", price: 10, quantity: 2 },
  ])

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [loadingPay, setLoadingPay] = useState(false)

  const openPayment = () => setIsPaymentOpen(true)
  const closePayment = () => setIsPaymentOpen(false)

  // ✅ This is what connects Payment.jsx → Mollie
  const handlePaymentConfirm = async (method) => {
    try {
      const user = auth.currentUser
      if (!user) {
        alert("Please login first.")
        return
      }

      if (!cartItems.length) return

      setLoadingPay(true)

      // Use an orderId (you can also use Firestore doc id if you already create order docs)
      const orderId = crypto.randomUUID()

      const result = await createMolliePayment({
        method,             // "ideal" or "paypal"
        amount: totalPrice, // number
        orderId,
        items: cartItems,   // optional snapshot
      })

      const checkoutUrl = result?.data?.checkoutUrl
      if (!checkoutUrl) {
        alert("No checkout URL returned from Mollie.")
        setLoadingPay(false)
        return
      }

      // Redirect to Mollie hosted checkout
      window.location.href = checkoutUrl
    } catch (err) {
      console.error(err)
      alert(err?.message || "Failed to start payment.")
      setLoadingPay(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold mb-4">Checkout</h1>

      <div className="bg-white rounded-xl shadow p-4">
        <p className="font-bold mb-2">Items: {cartItems.length}</p>
        <p className="font-bold mb-4">Total: €{totalPrice.toFixed(2)}</p>

        <button
          onClick={openPayment}
          disabled={!cartItems.length || loadingPay}
          className="bg-[#7B2220] text-white font-bold px-5 py-2 rounded-lg disabled:opacity-60"
        >
          {loadingPay ? "Preparing Payment..." : "Choose Payment Method"}
        </button>
      </div>

      <Payment
        isOpen={isPaymentOpen}
        onClose={closePayment}
        cartItems={cartItems}
        totalPrice={totalPrice}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  )
}
