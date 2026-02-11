import { useEffect, useMemo, useState } from "react"
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"
import { db } from "../../../firebase"
import { Eye, EyeOff, Save, RefreshCcw } from "lucide-react"

export default function PickupTab() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All Categories")
  const [savingId, setSavingId] = useState(null)
  const [bulkSaving, setBulkSaving] = useState(false)

  const [leftDraft, setLeftDraft] = useState({}) // { [id]: "3" }

  useEffect(() => {
    // ✅ Only products that are shown on Menu today
    const qRef = query(
      collection(db, "products"),
      where("showOnMenu", "==", true)
    )

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setProducts(data)

        // init drafts
        setLeftDraft((prev) => {
          const next = { ...prev }
          data.forEach((p) => {
            if (typeof next[p.id] === "undefined") {
              next[p.id] =
                typeof p.pickupLeft === "number"
                  ? String(p.pickupLeft)
                  : p.pickupLeft === null || typeof p.pickupLeft === "undefined"
                  ? ""
                  : String(p.pickupLeft)
            }
          })
          return next
        })

        setLoading(false)
      },
      (err) => {
        console.error("PickupTab snapshot error:", err)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [])

  const categories = useMemo(() => {
    return ["All Categories"].concat(
      Array.from(
        new Set(products.map((p) => (p.category || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b))
    )
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return products
      .filter((p) => {
        const matchesSearch =
          !q ||
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)

        const matchesCat =
          category === "All Categories" ? true : p.category === category

        return matchesSearch && matchesCat
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }, [products, search, category])

  const setPickupEnabled = async (p, nextValue) => {
    try {
      setSavingId(p.id)

      const update = { pickupEnabled: nextValue }

      // if enabling and pickupLeft is missing, default to dailyLimit or 0
      if (
        nextValue &&
        (p.pickupLeft === null ||
          typeof p.pickupLeft === "undefined" ||
          p.pickupLeft === "")
      ) {
        update.pickupLeft = typeof p.dailyLimit === "number" ? p.dailyLimit : 0
        setLeftDraft((prev) => ({
          ...prev,
          [p.id]: String(update.pickupLeft),
        }))
      }

      await updateDoc(doc(db, "products", p.id), update)
    } catch (e) {
      console.error("Failed to update pickupEnabled:", e)
      alert("Failed to update pickup toggle")
    } finally {
      setSavingId(null)
    }
  }

  const savePickupLeft = async (p) => {
    const raw = leftDraft[p.id]

    // allow blank -> null
    const value =
      raw === "" || raw === null || typeof raw === "undefined"
        ? null
        : Number(raw)

    if (value !== null && (Number.isNaN(value) || value < 0)) {
      alert("Pickup left must be a number (0 or more) or empty.")
      return
    }

    try {
      setSavingId(p.id)
      await updateDoc(doc(db, "products", p.id), { pickupLeft: value })
    } catch (e) {
      console.error("Failed to save pickupLeft:", e)
      alert("Failed to save pickup left")
    } finally {
      setSavingId(null)
    }
  }

  const bulkSetPickupEnabled = async (enabled) => {
    try {
      setBulkSaving(true)
      const batch = writeBatch(db)

      filtered.forEach((p) => {
        const patch = { pickupEnabled: enabled }

        if (
          enabled &&
          (p.pickupLeft === null || typeof p.pickupLeft === "undefined")
        ) {
          patch.pickupLeft = typeof p.dailyLimit === "number" ? p.dailyLimit : 0
        }

        batch.update(doc(db, "products", p.id), patch)
      })

      await batch.commit()
    } catch (e) {
      console.error("Bulk update pickupEnabled failed:", e)
      alert("Bulk update failed")
    } finally {
      setBulkSaving(false)
    }
  }

  const bulkResetLeftToDailyLimit = async () => {
    try {
      setBulkSaving(true)
      const batch = writeBatch(db)

      filtered.forEach((p) => {
        const fallback = typeof p.dailyLimit === "number" ? p.dailyLimit : 0
        batch.update(doc(db, "products", p.id), { pickupLeft: fallback })
        setLeftDraft((prev) => ({ ...prev, [p.id]: String(fallback) }))
      })

      await batch.commit()
    } catch (e) {
      console.error("Bulk reset pickupLeft failed:", e)
      alert("Bulk reset failed")
    } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pickup Today</h2>
          <p className="text-sm text-gray-500">
            Choose which Menu products appear in Pickup today (badge: x left / SOLD OUT).
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            disabled={bulkSaving}
            onClick={() => bulkSetPickupEnabled(true)}
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            Enable All
          </button>

          <button
            disabled={bulkSaving}
            onClick={() => bulkSetPickupEnabled(false)}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            Disable All
          </button>

          <button
            disabled={bulkSaving}
            onClick={bulkResetLeftToDailyLimit}
            className="px-4 py-2 rounded-lg bg-[#7B2220] text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            title="Set pickupLeft = dailyLimit (or 0 if missing)"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset Left
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-600">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or category…"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
            />
          </div>

          <div className="md:w-64">
            <label className="text-xs font-semibold text-gray-600">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Showing <span className="font-semibold">{filtered.length}</span> menu products.
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">
            No products found. (Make sure products have <b>showOnMenu: true</b>.)
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((p) => {
              const enabled = Boolean(p.pickupEnabled)

              const left =
                typeof p.pickupLeft === "number"
                  ? p.pickupLeft
                  : p.pickupLeft === null || typeof p.pickupLeft === "undefined"
                  ? null
                  : Number(p.pickupLeft)

              const soldOut = enabled && (p.available === false || left === 0)

              return (
                <div
                  key={p.id}
                  className="p-4 flex flex-col md:flex-row md:items-center gap-4"
                >
                  {/* left */}
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">
                          {p.name}
                        </p>

                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            enabled
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {enabled ? "Shown on Pickup" : "Hidden"}
                        </span>

                        {enabled && (
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              soldOut
                                ? "bg-[#F6E6C9] text-[#4A2B1A]"
                                : "bg-white border border-gray-200 text-gray-700"
                            }`}
                          >
                            {soldOut
                              ? "SOLD OUT"
                              : typeof left === "number"
                              ? `${left} left`
                              : "Available"}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500">
                        Category: {p.category || "—"}
                      </p>
                    </div>
                  </div>

                  {/* right */}
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      disabled={savingId === p.id || bulkSaving}
                      onClick={() => setPickupEnabled(p, !enabled)}
                      title={enabled ? "Hide from pickup" : "Show on pickup"}
                      className={`p-2 rounded-lg border transition disabled:opacity-50 ${
                        enabled
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {enabled ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        disabled={!enabled || savingId === p.id || bulkSaving}
                        value={leftDraft[p.id] ?? ""}
                        onChange={(e) =>
                          setLeftDraft((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        placeholder="left"
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-[#7B2220] disabled:bg-gray-50"
                        type="number"
                        min="0"
                      />

                      <button
                        disabled={!enabled || savingId === p.id || bulkSaving}
                        onClick={() => savePickupLeft(p)}
                        title="Save left"
                        className="p-2 rounded-lg bg-[#7B2220] text-white hover:opacity-90 transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Tip: Set <b>pickupLeft = 0</b> to show <b>SOLD OUT</b>.
      </div>
    </div>
  )
}
