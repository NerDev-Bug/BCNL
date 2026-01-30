import { useEffect, useState } from "react"
import { db } from "../../firebase" // adjust path
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore"

export default function Pages() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // ✅ Tabs
  const [activeTab, setActiveTab] = useState("home") // home | favorites | stories | testimonials

  // ✅ Put your Cloudinary details here
  const CLOUDINARY_CLOUD_NAME = "drgjco3qx"
  const CLOUDINARY_UPLOAD_PRESET = "admin_uploads"

  // ✅ products for favorites picker
  const [allProducts, setAllProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  // ✅ auto favorites (weekly most bought)
  const [autoFavoritesLoading, setAutoFavoritesLoading] = useState(false)
  const [autoFavoritesPreview, setAutoFavoritesPreview] = useState([]) // [{id,name,price,totalQty}]

  const [form, setForm] = useState({
    heading: "Our Story",
    section1: {
      title: "",
      body: "",
      ctaText: "Contact Us",
      bgImage: "",
      frameImage: "",
    },
    section2: {
      title: "",
      body: "",
      ctaText: "Contact Us",
      bgImage: "",
      frameImage: "",
    },
    testimonials: [
      { text: "", author: "" },
      { text: "", author: "" },
      { text: "", author: "" },
    ],

    // ✅ Favorites mode
    favoritesMode: "manual", // "manual" | "weeklyMostBought"

    // ✅ favorites (3 product IDs)
    favoritesProductIds: ["", "", ""],
  })

  // Load existing content
  useEffect(() => {
    const load = async () => {
      try {
        const refDoc = doc(db, "pages", "ourStory")
        const snap = await getDoc(refDoc)

        if (snap.exists()) {
          const data = snap.data()
          setForm((prev) => ({
            ...prev,
            ...data,
            favoritesMode: data.favoritesMode || prev.favoritesMode || "manual",
            section1: { ...prev.section1, ...(data.section1 || {}) },
            section2: { ...prev.section2, ...(data.section2 || {}) },
            testimonials: Array.isArray(data.testimonials)
              ? data.testimonials
              : prev.testimonials,
            favoritesProductIds: Array.isArray(data.favoritesProductIds)
              ? [
                  data.favoritesProductIds?.[0] || "",
                  data.favoritesProductIds?.[1] || "",
                  data.favoritesProductIds?.[2] || "",
                ]
              : prev.favoritesProductIds,
          }))
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // Load all products for favorites dropdown
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"))
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        items.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        )
        setAllProducts(items)
      } catch (e) {
        console.error("Failed to load products for favorites picker:", e)
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Safe nested update
  const update = (path, value) => {
    setForm((prev) => {
      const copy = structuredClone(prev)
      const keys = path.split(".")
      let cur = copy
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
      cur[keys[keys.length - 1]] = value
      return copy
    })
  }

  // Upload to Cloudinary
  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

    const res = await fetch(url, {
      method: "POST",
      body: fd,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(err)
    }

    const data = await res.json()
    return data.secure_url
  }

  const transformCloudinaryUrl = (url) => {
    return url.replace(
      "/upload/",
      "/upload/c_fill,g_auto,w_1852,h_1536,q_auto,f_auto/"
    )
  }

  const handleUpload = async (e, fieldPath) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const imageUrl = await uploadToCloudinary(file)
      const transformedUrl = transformCloudinaryUrl(imageUrl)
      update(fieldPath, transformedUrl)
    } catch (err) {
      console.error("Cloudinary upload failed:", err)
      alert("Upload failed. Check console.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const addTestimonial = () => {
    setForm((prev) => ({
      ...prev,
      testimonials: [...(prev.testimonials || []), { text: "", author: "" }],
    }))
  }

  const removeTestimonial = (idx) => {
    setForm((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== idx),
    }))
  }

  const setFavoriteAt = (index, productId) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      const ids = [...(next.favoritesProductIds || ["", "", ""])]
      ids[index] = productId

      // prevent duplicates
      const seen = new Set()
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]
        if (!id) continue
        if (seen.has(id)) ids[i] = ""
        else seen.add(id)
      }

      next.favoritesProductIds = ids
      return next
    })
  }

  // ✅ Week range (Mon-Sun)
  const getWeekRange = () => {
    const now = new Date()
    const day = now.getDay() // 0=Sun
    const diffToMonday = (day + 6) % 7

    const start = new Date(now)
    start.setDate(now.getDate() - diffToMonday)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 7)

    return { start, end }
  }

  // ✅ Compute Weekly Most Bought Top 3 (from orders collection)
  const computeWeeklyMostBoughtTop3 = async () => {
    setAutoFavoritesLoading(true)
    try {
      const { start, end } = getWeekRange()

      const ordersRef = collection(db, "orders")
      const q = query(
        ordersRef,
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<", Timestamp.fromDate(end))
      )

      const snap = await getDocs(q)
      const counts = new Map() // productId -> totalQty

      snap.docs.forEach((d) => {
        const o = d.data()
        const items = Array.isArray(o.items) ? o.items : []
        items.forEach((it) => {
          const pid = it.productId || it.id // supports both
          const qty = Number(it.quantity || 1)
          if (!pid) return
          counts.set(pid, (counts.get(pid) || 0) + qty)
        })
      })

      const topIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id)

      const padded = [topIds[0] || "", topIds[1] || "", topIds[2] || ""]

      const preview = padded
        .filter(Boolean)
        .map((id) => {
          const p = allProducts.find((x) => x.id === id)
          return {
            id,
            name: p?.name || "Unnamed",
            price: p?.price,
            totalQty: counts.get(id) || 0,
          }
        })

      // store in form
      setForm((prev) => {
        const next = structuredClone(prev)
        next.favoritesProductIds = padded
        return next
      })

      setAutoFavoritesPreview(preview)
    } catch (e) {
      console.error("Failed to compute weekly most bought:", e)
      alert("Failed to compute weekly most bought. Check console.")
    } finally {
      setAutoFavoritesLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const refDoc = doc(db, "pages", "ourStory")
      await setDoc(
        refDoc,
        {
          ...form,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      alert("Our Story updated!")
    } catch (err) {
      console.error("Save failed:", err)
      alert("Save failed. Check console.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  const tabBtn = (key) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
      activeTab === key
        ? "bg-[#7B2220] text-white"
        : "bg-white border text-[#7B2220] hover:bg-[#7B2220] hover:text-white"
    }`

  return (
    <div className="p-6">
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pages</h1>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className={tabBtn("home")}
            onClick={() => setActiveTab("home")}
          >
            Home
          </button>
          <button
            type="button"
            className={tabBtn("favorites")}
            onClick={() => setActiveTab("favorites")}
          >
            Favorites
          </button>
          <button
            type="button"
            className={tabBtn("stories")}
            onClick={() => setActiveTab("stories")}
          >
            Our Stories
          </button>
          <button
            type="button"
            className={tabBtn("testimonials")}
            onClick={() => setActiveTab("testimonials")}
          >
            Testimonials
          </button>
        </div>
      </div>

      {uploading && (
        <p className="text-sm text-gray-600 mb-4">Uploading image...</p>
      )}

      {/* HOME TAB */}
      {activeTab === "home" && (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <label className="block text-sm font-semibold mb-2">Heading</label>
          <input
            value={form.heading}
            onChange={(e) => update("heading", e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Our Story"
          />
        </div>
      )}

      {/* FAVORITES TAB */}
      {activeTab === "favorites" && (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-2">Favorites</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose how Favorites are selected.
          </p>

          {/* ✅ MODE SELECT */}
          <div className="flex flex-wrap gap-3 mb-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="favMode"
                checked={(form.favoritesMode || "manual") === "manual"}
                onChange={() => update("favoritesMode", "manual")}
              />
              Admin picks 3
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="favMode"
                checked={form.favoritesMode === "weeklyMostBought"}
                onChange={() => update("favoritesMode", "weeklyMostBought")}
              />
              Auto: Weekly Most Bought
            </label>
          </div>

          {/* ✅ AUTO WEEKLY */}
          {form.favoritesMode === "weeklyMostBought" && (
            <div className="border rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-semibold">
                  This will pick Top 3 products based on this week&apos;s orders.
                </p>

                <button
                  type="button"
                  onClick={computeWeeklyMostBoughtTop3}
                  disabled={autoFavoritesLoading || productsLoading}
                  className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
                >
                  {autoFavoritesLoading ? "Computing..." : "Compute Now"}
                </button>
              </div>

              {autoFavoritesPreview.length > 0 && (
                <div className="mt-4 space-y-2 text-sm">
                  {autoFavoritesPreview.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between"
                    >
                      <span>
                        #{idx + 1} {p.name}
                        {p.price != null ? ` • €${p.price}` : ""}
                      </span>
                      <span className="text-gray-600">qty: {p.totalQty}</span>
                    </div>
                  ))}
                </div>
              )}

              {autoFavoritesPreview.length === 0 && !autoFavoritesLoading && (
                <p className="mt-3 text-sm text-gray-600">
                  Click “Compute Now” to generate this week’s Top 3.
                </p>
              )}
            </div>
          )}

          {/* ✅ MANUAL PICKER */}
          {form.favoritesMode !== "weeklyMostBought" && (
            <>
              {productsLoading ? (
                <div className="text-sm">Loading products...</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <label className="block text-sm font-semibold mb-2">
                        Product #{i + 1}
                      </label>
                      <select
                        value={form.favoritesProductIds?.[i] || ""}
                        onChange={(e) => setFavoriteAt(i, e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">— Select product —</option>
                        {allProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || "Unnamed"}{" "}
                            {p.price != null ? `• €${p.price}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* OUR STORIES TAB (section1 + section2 ONLY) */}
      {activeTab === "stories" && (
        <>
          {/* Section 1 */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <h2 className="text-lg font-bold mb-4">Section 1</h2>

            <label className="block text-sm font-semibold mb-2">Title</label>
            <input
              value={form.section1.title}
              onChange={(e) => update("section1.title", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <label className="block text-sm font-semibold mb-2">Body</label>
            <textarea
              value={form.section1.body}
              onChange={(e) => update("section1.body", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              rows={5}
            />

            <label className="block text-sm font-semibold mb-2">
              Button Text
            </label>
            <input
              value={form.section1.ctaText}
              onChange={(e) => update("section1.ctaText", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Background Image (redpaint)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, "section1.bgImage")}
                  className="w-full"
                  disabled={uploading}
                />
                {form.section1.bgImage && (
                  <img
                    src={form.section1.bgImage}
                    alt="section1 bg"
                    className="mt-3 w-full rounded-lg border"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Frame Image (single_frame)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, "section1.frameImage")}
                  className="w-full"
                  disabled={uploading}
                />
                {form.section1.frameImage && (
                  <img
                    src={form.section1.frameImage}
                    alt="section1 frame"
                    className="mt-3 w-full rounded-lg border"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <h2 className="text-lg font-bold mb-4">Section 2</h2>

            <label className="block text-sm font-semibold mb-2">Title</label>
            <input
              value={form.section2.title}
              onChange={(e) => update("section2.title", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <label className="block text-sm font-semibold mb-2">Body</label>
            <textarea
              value={form.section2.body}
              onChange={(e) => update("section2.body", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              rows={5}
            />

            <label className="block text-sm font-semibold mb-2">
              Button Text
            </label>
            <input
              value={form.section2.ctaText}
              onChange={(e) => update("section2.ctaText", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Background Image (bg_purple)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, "section2.bgImage")}
                  className="w-full"
                  disabled={uploading}
                />
                {form.section2.bgImage && (
                  <img
                    src={form.section2.bgImage}
                    alt="section2 bg"
                    className="mt-3 w-full rounded-lg border"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Frame Image (group_frame)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, "section2.frameImage")}
                  className="w-full"
                  disabled={uploading}
                />
                {form.section2.frameImage && (
                  <img
                    src={form.section2.frameImage}
                    alt="section2 frame"
                    className="mt-3 w-full rounded-lg border"
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TESTIMONIALS TAB (ONLY testimonials show) */}
      {activeTab === "testimonials" && (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Testimonials</h2>
            <button
              onClick={addTestimonial}
              className="px-4 py-2 rounded-lg bg-black text-white"
              type="button"
            >
              + Add
            </button>
          </div>

          <div className="space-y-4">
            {form.testimonials.map((t, idx) => (
              <div key={idx} className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold">Testimonial #{idx + 1}</p>
                  <button
                    onClick={() => removeTestimonial(idx)}
                    className="text-sm text-red-600"
                    type="button"
                  >
                    Remove
                  </button>
                </div>

                <label className="block text-sm font-semibold mb-2">Text</label>
                <textarea
                  value={t.text}
                  onChange={(e) =>
                    update(`testimonials.${idx}.text`, e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 mb-4"
                  rows={3}
                />

                <label className="block text-sm font-semibold mb-2">
                  Author
                </label>
                <input
                  value={t.author}
                  onChange={(e) =>
                    update(`testimonials.${idx}.author`, e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="– Name"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save always visible */}
      <button
        onClick={save}
        disabled={saving || uploading || autoFavoritesLoading}
        className="bg-[#7B2220] text-white px-6 py-3 rounded-xl disabled:opacity-60"
        type="button"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  )
}
