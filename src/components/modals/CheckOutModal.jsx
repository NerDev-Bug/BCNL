import { useEffect, useState } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "../../firebase"

function CheckOutModal({
  isOpen,
  onClose,
  cartItems = [],
  totalPrice,
  onSaveOrder
}) {
  const [form, setForm] = useState({
    receiverName: "",
    streetName: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    country: "Netherlands",
    contactNumber: "",
    email: "",
    paymentMethod: "cod"
  })

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
          streetName: data.address?.streetName || "",
          houseNumber: data.address?.houseNumber || "",
          postalCode: data.address?.postalCode || "",
          city: data.address?.city || "",
          country: data.address?.country || "Netherlands",
          contactNumber: data.phone || "",
          email: user.email || ""
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
            Loading checkout...
          </div>
        </div>
      </>
    )
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSaveChanges = async () => {
    if (!form.receiverName || !form.streetName || !form.houseNumber || !form.postalCode || !form.city || !form.contactNumber) {
      alert("Please complete all address fields.")
      return
    }

    setIsSaving(true)
    try {
      const user = auth.currentUser
      if (!user) return
      
      await updateDoc(doc(db, "users", user.uid), {
        username: form.receiverName,
        phone: form.contactNumber,
        address: {
          streetName: form.streetName,
          houseNumber: form.houseNumber,
          postalCode: form.postalCode.toUpperCase(),
          city: form.city,
          country: form.country
        }
      })

      setIsEditing(false)
      alert("Information updated successfully!")
    } catch (err) {
      console.error("Error saving changes:", err)
      alert("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = () => {
    if (!form.receiverName || !form.streetName || !form.houseNumber || !form.postalCode || !form.city || !form.contactNumber) {
      alert("Please complete all address fields.")
      return
    }

    onSaveOrder?.({
      items: cartItems,
      totalPrice,
      receiverName: form.receiverName,
      streetName: form.streetName,
      houseNumber: form.houseNumber,
      postalCode: form.postalCode,
      city: form.city,
      country: form.country,
      contactNumber: form.contactNumber,
      email: form.email,
      paymentMethod: form.paymentMethod
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

            <div>
              <label className="text-xs font-medium">Street Name</label>
              <input
                name="streetName"
                value={form.streetName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g., Amstelplein"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-medium">House Number</label>
              <input
                name="houseNumber"
                value={form.houseNumber}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g., 150"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Postal Code</label>
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value.toUpperCase() })}
                  disabled={!isEditing}
                  placeholder="e.g., 1096 BC"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium">City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Country</label>
              <input
                name="country"
                value={form.country}
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
          </div>

          {/* Order Summary */}
          <div className="border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm">Order Summary</h3>
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm text-gray-600"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>€{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total</span>
              <span>€{totalPrice}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Payment Method</h3>

            {["cod", "gcash"].map((method) => (
              <label
                key={method}
                className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer ${
                  form.paymentMethod === method
                    ? "border-[#7B2220] bg-[#7B2220]/5"
                    : ""
                }`}
              >
                <span className="text-sm">
                  {method === "cod" ? "Cash on Delivery" : "GCash"}
                </span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={form.paymentMethod === method}
                  onChange={handleChange}
                />
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="w-1/3 border rounded-lg py-3 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="w-2/3 bg-[#7B2220] text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default CheckOutModal
