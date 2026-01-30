import { useEffect, useState } from "react"
import { db } from "../../firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "react-toastify"

export default function UserPayment({ user }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    cardholderName: "",
    brand: "Visa",
    last4: "",
    expMonth: "",
    expYear: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, "users", user.uid, "payment", "default")
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          setForm({
            cardholderName: data?.cardholderName || "",
            brand: data?.brand || "Visa",
            last4: data?.last4 || "",
            expMonth: data?.expMonth || "",
            expYear: data?.expYear || "",
          })
        }
      } catch (e) {
        console.error("Failed to load payment info:", e)
      } finally {
        setLoading(false)
      }
    }

    if (user?.uid) load()
  }, [user?.uid])

  const onChange = (key) => (e) => {
    let v = e.target.value

    if (key === "last4") v = v.replace(/\D/g, "").slice(0, 4)
    if (key === "expMonth") v = v.replace(/\D/g, "").slice(0, 2)
    if (key === "expYear") v = v.replace(/\D/g, "").slice(0, 4)

    setForm((p) => ({ ...p, [key]: v }))
  }

  const save = async (e) => {
    e.preventDefault()

    // basic validation
    if (!form.cardholderName.trim()) return toast.error("Cardholder name is required")
    if (String(form.last4).length !== 4) return toast.error("Last 4 digits must be 4 numbers")
    if (!form.expMonth || Number(form.expMonth) < 1 || Number(form.expMonth) > 12)
      return toast.error("Expiry month must be 01 to 12")
    if (!form.expYear || String(form.expYear).length !== 4) return toast.error("Expiry year must be 4 digits")

    setSaving(true)
    try {
      const ref = doc(db, "users", user.uid, "payment", "default")
      await setDoc(
        ref,
        {
          cardholderName: form.cardholderName.trim(),
          brand: form.brand,
          last4: form.last4,
          expMonth: form.expMonth,
          expYear: form.expYear,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success("Payment information saved")
    } catch (e) {
      console.error("Failed to save payment info:", e)
      toast.error("Failed to save payment information")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-500">Loading payment information...</div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Payment Information</h2>

      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">
          For your security, we only store non-sensitive info (brand, last 4, expiry). We never store full card number or
          CVV.
        </p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Cardholder Name</label>
          <input
            value={form.cardholderName}
            onChange={onChange("cardholderName")}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Juan Dela Cruz"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Card Brand</label>
          <select value={form.brand} onChange={onChange("brand")} className="w-full border rounded px-3 py-2">
            <option>Visa</option>
            <option>Mastercard</option>
            <option>Amex</option>
            <option>Discover</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Last 4 Digits</label>
          <input
            value={form.last4}
            onChange={onChange("last4")}
            className="w-full border rounded px-3 py-2"
            placeholder="1234"
            inputMode="numeric"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Expiry Month</label>
            <input
              value={form.expMonth}
              onChange={onChange("expMonth")}
              className="w-full border rounded px-3 py-2"
              placeholder="MM"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Expiry Year</label>
            <input
              value={form.expYear}
              onChange={onChange("expYear")}
              className="w-full border rounded px-3 py-2"
              placeholder="YYYY"
              inputMode="numeric"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full bg-[#7B2220] text-white px-4 py-2 rounded hover:opacity-90 ${
            saving ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {saving ? "Saving..." : "Save Payment Info"}
        </button>
      </form>
    </div>
  )
}
