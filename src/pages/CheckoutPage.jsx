import { useMemo, useState } from "react"
import { httpsCallable } from "firebase/functions"
import { functions, auth, db } from "../firebase"
import Payment from "../modals/Payment"

import { addDoc, collection, serverTimestamp } from "firebase/firestore"

// Callable cloud function name MUST match your deployed function
const createPayment = httpsCallable(functions, "createPayment")

export default function CheckoutPage() {
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

  const handlePaymentConfirm = async (method) => {
    try {
      const user = auth.currentUser
      if (!user) {
        alert("Please login first.")
        return
      }

      if (!cartItems.length) return

      setLoadingPay(true)

      // ✅ 1) Create Firestore order first (auto ID)
      const orderRef = await addDoc(collection(db, "orders"), {
        createdAt: serverTimestamp(),
        userId: user.uid,
        email: user.email || null,

        items: cartItems,
        total: Number(totalPrice.toFixed(2)),
        currency: "EUR",

        paymentMethod: method || "ideal",
        paymentStatus: "created",
      })

      const orderId = orderRef.id // ✅ THIS is the Firestore doc id

      // ✅ 2) Create Mollie payment using Firestore orderId
      const result = await createPayment({
        amount: totalPrice, // number
        description: `BCNL Order ${orderId}`,
        orderId,            // ✅ Firestore doc id
        items: cartItems,   // optional snapshot
      })

      const checkoutUrl = result?.data?.checkoutUrl
      if (!checkoutUrl) {
        alert("No checkout URL returned from Mollie.")
        setLoadingPay(false)
        return
      }

      // ✅ 3) Redirect to Mollie hosted checkout
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
