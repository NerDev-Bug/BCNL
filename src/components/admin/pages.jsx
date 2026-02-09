import { useEffect, useState } from "react"
import { db } from "../../firebase"
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

import TabsHeader from "./pages_components/TabsHeader"
import HomeTab from "./pages_components/HomeTab"
import FavoritesTab from "./pages_components/FavoritesTab"
import StoriesTab from "./pages_components/StoriesTab"
import TestimonialsTab from "./pages_components/TestimonialsTab"
import EventsTab from "./pages_components/EventsTab"

export default function Pages() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // ✅ Tabs
  const [activeTab, setActiveTab] = useState("home") // home | favorites | stories | testimonials | events

  // ✅ Cloudinary
  const CLOUDINARY_CLOUD_NAME = "drgjco3qx"
  const CLOUDINARY_UPLOAD_PRESET = "admin_uploads"

  // ✅ products for favorites picker
  const [allProducts, setAllProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  // ✅ auto favorites (weekly most bought)
  const [autoFavoritesLoading, setAutoFavoritesLoading] = useState(false)
  const [autoFavoritesPreview, setAutoFavoritesPreview] = useState([])

  /**
   * ✅ HOME FORM (separate doc: pages/home)
   * Only for Home hero content
   */
  const [homeForm, setHomeForm] = useState({
    heading: "Homemade cakes and pastries",
    estText: "est. 2019",
    cakeImage: "",
  })

  /**
   * ✅ OUR STORY / FAVORITES / TESTIMONIALS FORM (doc: pages/ourStory)
   */
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
    favoritesMode: "manual", // "manual" | "weeklyMostBought"
    favoritesProductIds: ["", "", ""],
  })

  // ✅ Load Home content (pages/home)
  useEffect(() => {
    const loadHome = async () => {
      try {
        const snap = await getDoc(doc(db, "pages", "home"))
        if (snap.exists()) {
          const data = snap.data()
          setHomeForm((prev) => ({
            ...prev,
            ...data,
          }))
        }
      } catch (e) {
        console.error("Failed to load home:", e)
      }
    }
    loadHome()
  }, [])

  // ✅ Load OurStory content (pages/ourStory)
  useEffect(() => {
    const loadOurStory = async () => {
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
      } catch (e) {
        console.error("Failed to load ourStory:", e)
      } finally {
        setLoading(false)
      }
    }
    loadOurStory()
  }, [])

  // ✅ Load all products for favorites
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"))
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        items.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        )
        setAllProducts(items)
      } catch (e) {
        console.error("Failed to load products:", e)
      } finally {
        setProductsLoading(false)
      }
    }
    loadProducts()
  }, [])

  // ✅ Safe nested update for ourStory form
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

  // ✅ Simple update for home form (flat)
  const updateHome = (key, value) => {
    setHomeForm((prev) => ({ ...prev, [key]: value }))
  }

  // ✅ Cloudinary upload (images)
  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

    const res = await fetch(url, { method: "POST", body: fd })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return data.secure_url
  }

  const transformCloudinaryUrl = (url) =>
    url.replace(
      "/upload/",
      "/upload/c_fill,g_auto,w_1852,h_1536,q_auto,f_auto/"
    )

  const handleUpload = async (file, fieldPath) => {
    if (!file) return
    setUploading(true)
    try {
      const imageUrl = await uploadToCloudinary(file)
      update(fieldPath, transformCloudinaryUrl(imageUrl))
    } catch (err) {
      console.error("Cloudinary upload failed:", err)
      alert("Upload failed. Check console.")
    } finally {
      setUploading(false)
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
      const counts = new Map()

      snap.docs.forEach((d) => {
        const o = d.data()
        const items = Array.isArray(o.items) ? o.items : []
        items.forEach((it) => {
          const pid = it.productId || it.id
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

      setForm((prev) => ({ ...prev, favoritesProductIds: padded }))
      setAutoFavoritesPreview(preview)
    } catch (e) {
      console.error("Failed to compute weekly most bought:", e)
      alert("Failed to compute weekly most bought. Check console.")
    } finally {
      setAutoFavoritesLoading(false)
    }
  }

  // ✅ Save: saves based on active tab
  const save = async () => {
    setSaving(true)
    try {
      if (activeTab === "home") {
        await setDoc(
          doc(db, "pages", "home"),
          { ...homeForm, updatedAt: serverTimestamp() },
          { merge: true }
        )
        alert("Home updated!")
        return
      }

      // everything else uses pages/ourStory
      await setDoc(
        doc(db, "pages", "ourStory"),
        { ...form, updatedAt: serverTimestamp() },
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

  return (
    <div className="p-6">
      <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {uploading && (
        <p className="text-sm text-gray-600 mb-4">Uploading image...</p>
      )}

      {activeTab === "home" && (
        <HomeTab
          form={homeForm}
          update={updateHome}
          cloudName={CLOUDINARY_CLOUD_NAME}
          uploadPreset={CLOUDINARY_UPLOAD_PRESET}
        />
      )}

      {activeTab === "favorites" && (
        <FavoritesTab
          form={form}
          update={update}
          allProducts={allProducts}
          productsLoading={productsLoading}
          autoFavoritesLoading={autoFavoritesLoading}
          autoFavoritesPreview={autoFavoritesPreview}
          computeWeeklyMostBoughtTop3={computeWeeklyMostBoughtTop3}
          setFavoriteAt={setFavoriteAt}
        />
      )}

      {activeTab === "stories" && (
        <StoriesTab
          form={form}
          update={update}
          uploading={uploading}
          handleUpload={handleUpload}
        />
      )}

      {activeTab === "testimonials" && (
        <TestimonialsTab
          form={form}
          update={update}
          addTestimonial={addTestimonial}
          removeTestimonial={removeTestimonial}
        />
      )}

      {activeTab === "events" && <EventsTab />}

      {/* Save always visible */}
      <button
        onClick={save}
        disabled={saving || uploading || autoFavoritesLoading}
        className="bg-[#7B2220] text-white px-6 py-3 rounded-xl disabled:opacity-60"
        type="button"
      >
        {saving
          ? "Saving..."
          : activeTab === "home"
          ? "Save Home"
          : "Save Changes"}
      </button>
    </div>
  )
}
