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
  })

  const [deliveryMethod, setDeliveryMethod] = useState("pickup") // pickup | delivery
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

        setForm((prev) => ({
          ...prev,
          receiverName: data.username || "",
          contactNumber: data.phone || "",
          email: user.email || "",
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

  const handleSaveChanges = async () => {
    if (!form.receiverName || !form.contactNumber) {
      toast.error("Please complete required fields.")
      return
    }

    setIsSaving(true)
    try {
      const user = auth.currentUser
      if (!user) return

      // Only update phone number — don't overwrite the Firestore username with receiverName
      await updateDoc(doc(db, "users", user.uid), {
        phone: form.contactNumber,
      })

      setIsEditing(false)
      toast.success("Information updated successfully!")
    } catch (err) {
      console.error("Error saving changes:", err)
      toast.error("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = () => {
    if (!form.receiverName || !form.contactNumber) {
      toast.error("Please complete required fields.")
      return
    }

    if (deliveryMethod === "delivery") {
      toast.info("Delivery is coming soon. Please select pickup.")
      return
    }

    onSaveOrder?.({
      items: cartItems,
      totalPrice,
      receiverName: form.receiverName,
      contactNumber: form.contactNumber,
      email: form.email,
      notes: form.notes.trim() || null,
      method: deliveryMethod,
    })

    onClose()
  }

  const inputClass =
    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220] disabled:bg-gray-100"

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
              Checkout
            </h2>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-black"
            >
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
                  name="method"
                  checked={deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                />
                Pickup
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer opacity-60">
                <input
                  type="radio"
                  name="method"
                  checked={deliveryMethod === "delivery"}
                  onChange={() => setDeliveryMethod("delivery")}
                />
                Delivery (Coming Soon)
              </label>
            </div>

            {deliveryMethod === "delivery" && (
              <p className="text-xs text-orange-600">
                🚧 Delivery is coming soon. Please select pickup for now.
              </p>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Customer Information</h3>
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveChanges()
                  } else {
                    setIsEditing(true)
                  }
                }}
                disabled={isSaving}
                className="text-xs px-3 py-1 rounded-full border hover:bg-gray-100 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : isEditing ? "Done" : "Edit"}
              </button>
            </div>

            <div>
              <label className="text-xs font-medium">Receiver Name</label>
              <input
                name="receiverName"
                value={form.receiverName}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Contact Number</label>
                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-medium">Email</label>
                <input
                  value={form.email}
                  disabled
                  className={`${inputClass} bg-gray-100`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Notes / Special Instructions <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Allergies, preferred pickup time, special requests..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm">Order Summary</h3>
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span>{item.name} × {item.quantity}</span>
                <span>€{(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total</span>
              <span>€{Number(totalPrice || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
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
