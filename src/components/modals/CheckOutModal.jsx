import { useEffect, useState } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "../../firebase"
import { toast } from "react-toastify"

function CheckOutModal({
  isOpen,
  onClose,
  cartItems = [],
  totalPrice,
  onSaveOrder
}) {
  const [form, setForm] = useState({
    receiverName: "",
    contactNumber: "",
    email: "",
    notes: "",
    address: "",
  })

  const [deliveryMethod, setDeliveryMethod] = useState("pickup")
  const [loadingUser, setLoadingUser] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const loadUserData = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        const snap = await getDoc(doc(db, "users", user.uid))
        if (!snap.exists()) return

        const data = snap.data()

        // ✅ FORMAT FULL ADDRESS
        const fullAddress = data.address
          ? `${data.address.streetName || ""} ${data.address.houseNumber || ""}, ${data.address.postalCode || ""} ${data.address.city || ""}, ${data.address.country || ""}`
          : ""

        setForm((prev) => ({
          ...prev,
          receiverName: data.username || "",
          contactNumber: data.phone || "",
          email: user.email || "",
          address: fullAddress.trim(),
        }))
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingUser(false)
      }
    }

    loadUserData()
  }, [isOpen])

  if (!isOpen) return null

  if (loadingUser) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-50" />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            Loading checkout..
          </div>
        </div>
      </>
    )
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
  if (!form.receiverName || !form.contactNumber) {
    toast.error("Please complete required fields.")
    return
  }

  // 🚧 DELIVERY STILL BLOCKED
  if (deliveryMethod === "delivery") {
    toast.info("🚧 Delivery is coming soon. Please select pickup.")
    return
  }

  onSaveOrder?.({
    items: cartItems,
    totalPrice,
    receiverName: form.receiverName,
    contactNumber: form.contactNumber,
    email: form.email,
    notes: form.notes.trim() || null,
    address: null, // since delivery not active yet
    method: deliveryMethod,
  })

  onClose()
}

  const inputClass =
    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220] disabled:bg-gray-100"

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-50" />

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-6 space-y-6">

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#7B2220]">Checkout</h2>
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-black">
              ✕
            </button>
          </div>

          {/* Delivery Method */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm">Delivery Method</h3>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                />
                Pickup
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={deliveryMethod === "delivery"}
                  onChange={() => setDeliveryMethod("delivery")}
                />
                Delivery
              </label>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm">Customer Information</h3>

            <input
              name="receiverName"
              value={form.receiverName}
              onChange={handleChange}
              className={inputClass}
              placeholder="Receiver Name"
            />

            <input
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              className={inputClass}
              placeholder="Contact Number"
            />

            <input
              value={form.email}
              disabled
              className={`${inputClass} bg-gray-100`}
            />

            {deliveryMethod === "delivery" && (
  <div>
    <label className="text-xs font-medium">
      Delivery Address
    </label>

    <textarea
      name="address"
      value={form.address}
      onChange={handleChange}
      rows={2}
      className={`${inputClass} resize-none`}
      placeholder="Delivery Address"
    />

    <p className="text-xs text-orange-600 mt-1">
      🚧 Delivery service is not yet available.
    </p>
  </div>
)}
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Notes (optional)"
            />
          </div>

          {/* Order Summary */}
          <div className="border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm">Order Summary</h3>

            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span>{item.name} × {item.quantity}</span>
                <span>
                  €{(Number(item.price || 0) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total</span>
              <span>€{Number(totalPrice || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="w-1/3 border rounded-lg py-3 text-sm">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="w-2/3 bg-[#7B2220] text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90"
            >
              Continue
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

export default CheckOutModal