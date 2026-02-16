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
import { toast } from "react-toastify"

import TabsHeader from "./pages_components/TabsHeader"
import HomeTab from "./pages_components/HomeTab"
import FavoritesTab from "./pages_components/FavoritesTab"
import StoriesTab from "./pages_components/StoriesTab"
import TestimonialsTab from "./pages_components/TestimonialsTab"
import EventsTab from "./pages_components/EventsTab"
import PickupTab from "./pages_components/PickupTab"
import PolicyTab from "./pages_components/PolicyTab"
import Loading from "../common/Loading"

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

  // ✅ ratings for testimonials picker
  const [allRatings, setAllRatings] = useState([])
  const [ratingsLoading, setRatingsLoading] = useState(true)

  // ✅ auto testimonials (top rated with comments)
  const [autoTestimonialsLoading, setAutoTestimonialsLoading] = useState(false)
  const [autoTestimonialsPreview, setAutoTestimonialsPreview] = useState([])

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
    testimonialsMode: "manual", // "manual" | "autoTopRated"
    testimonialsRatingIds: ["", "", ""], // IDs from ratings collection
  })

  /**
   * ✅ POLICY & ADS FORM (doc: pages/policyAds)
   */
  const [policyForm, setPolicyForm] = useState({
    title: "Policy",
    content: "Please be advised that any changes, cancellations, or special requests related to your order must be made at least five (5) days before the scheduled delivery date, as orders that are already within this preparation period may have begun processing, sourcing of ingredients, or production, and therefore we cannot guarantee modifications, refunds, or adjustments once the order is within five days of delivery.",
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
            testimonialsMode: data.testimonialsMode || prev.testimonialsMode || "manual",
            testimonialsRatingIds: Array.isArray(data.testimonialsRatingIds)
              ? [
                  data.testimonialsRatingIds?.[0] || "",
                  data.testimonialsRatingIds?.[1] || "",
                  data.testimonialsRatingIds?.[2] || "",
                ]
              : prev.testimonialsRatingIds || ["", "", ""],
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

  // ✅ Load Policy & Ads content (pages/policyAds)
  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const snap = await getDoc(doc(db, "pages", "policyAds"))
        if (snap.exists()) {
          const data = snap.data()
          setPolicyForm((prev) => ({
            ...prev,
            ...data,
          }))
        }
      } catch (e) {
        console.error("Failed to load policy:", e)
      }
    }
    loadPolicy()
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

  // ✅ Load all ratings for testimonials (including those without comments)
  useEffect(() => {
    const loadRatings = async () => {
      try {
        const snap = await getDocs(collection(db, "ratings"))
        const items = snap.docs
          .map((d) => {
            const data = d.data()
            let createdAt = new Date()
            if (data.createdAt?.toDate) {
              createdAt = data.createdAt.toDate()
            } else if (data.createdAt?.seconds) {
              createdAt = new Date(data.createdAt.seconds * 1000)
            }
            return {
              id: d.id,
              ...data,
              createdAt,
            }
          })
          .sort((a, b) => {
            // Sort by rating (desc) then by date (desc)
            if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0)
            return b.createdAt - a.createdAt
          })
        setAllRatings(items)
      } catch (e) {
        console.error("Failed to load ratings:", e)
      } finally {
        setRatingsLoading(false)
      }
    }
    loadRatings()
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

  // ✅ Simple update for policy form (flat)
  const updatePolicy = (key, value) => {
    setPolicyForm((prev) => ({ ...prev, [key]: value }))
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
      toast.error("Upload failed. Check console.", {
        position: "top-right",
        autoClose: 3000,
      })
    } finally {
      setUploading(false)
    }
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

  const setTestimonialAt = (index, ratingId) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      const ids = [...(next.testimonialsRatingIds || ["", "", ""])]
      ids[index] = ratingId

      // prevent duplicates
      const seen = new Set()
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]
        if (!id) continue
        if (seen.has(id)) ids[i] = ""
        else seen.add(id)
      }

      // Update testimonials array based on selected rating IDs
      const testimonials = ids.map((id) => {
        if (!id) return { text: "", author: "" }
        const rating = allRatings.find((r) => r.id === id)
        if (!rating) return { text: "", author: "" }
        
        // Use comment if available, otherwise use rating as text
        const text = rating.comment && rating.comment.trim()
          ? rating.comment
          : rating.rating
          ? `Rated ${rating.rating} out of 5 stars`
          : "Customer feedback"
        
        return {
          text,
          author: rating.rating ? `Customer (${rating.rating}⭐)` : "Customer",
        }
      })

      next.testimonialsRatingIds = ids
      next.testimonials = testimonials
      return next
    })
  }

  const computeAutoTopRatedTestimonials = async () => {
    setAutoTestimonialsLoading(true)
    try {
      // Get top 3 highest rated testimonials (prefer those with comments, but include all)
      const top3 = allRatings
        .slice(0, 3)
        .map((r) => r.id)

      const padded = [top3[0] || "", top3[1] || "", top3[2] || ""]

      // Update testimonialsRatingIds
      setForm((prev) => {
        const next = structuredClone(prev)
        next.testimonialsRatingIds = padded

        // Update testimonials array
        const testimonials = padded.map((id) => {
          if (!id) return { text: "", author: "" }
          const rating = allRatings.find((r) => r.id === id)
          if (!rating) return { text: "", author: "" }
          
          // Use comment if available, otherwise use rating as text
          const text = rating.comment && rating.comment.trim()
            ? rating.comment
            : rating.rating
            ? `Rated ${rating.rating} out of 5 stars`
            : "Customer feedback"
          
          return {
            text,
            author: rating.rating ? `Customer (${rating.rating}⭐)` : "Customer",
          }
        })

        next.testimonials = testimonials
        return next
      })

      // Set preview
      const preview = padded
        .filter(Boolean)
        .map((id) => {
          const r = allRatings.find((x) => x.id === id)
          return {
            id,
            comment: (r?.comment && r.comment.trim()) ? r.comment : null,
            rating: r?.rating || 0,
            createdAt: r?.createdAt || new Date(),
          }
        })

      setAutoTestimonialsPreview(preview)
    } catch (e) {
      console.error("Failed to compute auto testimonials:", e)
      toast.error("Failed to compute auto testimonials. Check console.", {
        position: "top-right",
        autoClose: 3000,
      })
    } finally {
      setAutoTestimonialsLoading(false)
    }
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
      toast.error("Failed to compute weekly most bought. Check console.", {
        position: "top-right",
        autoClose: 3000,
      })
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
        toast.success("Home page updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        })
        return
      }

      if (activeTab === "policy") {
        await setDoc(
          doc(db, "pages", "policyAds"),
          { ...policyForm, updatedAt: serverTimestamp() },
          { merge: true }
        )
        toast.success("Policy & Ads updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        })
        return
      }

      // everything else uses pages/ourStory
      await setDoc(
        doc(db, "pages", "ourStory"),
        { ...form, updatedAt: serverTimestamp() },
        { merge: true }
      )
      toast.success("Page updated successfully!", {
        position: "top-right",
        autoClose: 3000,
      })
    } catch (err) {
      console.error("Save failed:", err)
      toast.error("Save failed. Check console.", {
        position: "top-right",
        autoClose: 3000,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Loading
        message="Loading page content..."
        fullscreen
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

        {uploading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Loading
              message="Uploading image..."
              size="text-xl"
            />
          </div>
        )}

        <div className="mb-6">
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
              allRatings={allRatings}
              ratingsLoading={ratingsLoading}
              autoTestimonialsLoading={autoTestimonialsLoading}
              autoTestimonialsPreview={autoTestimonialsPreview}
              computeAutoTopRatedTestimonials={computeAutoTopRatedTestimonials}
              setTestimonialAt={setTestimonialAt}
            />
          )}

          {activeTab === "events" && <EventsTab />}
          {activeTab === "pickup" && <PickupTab />}
          {activeTab === "policy" && (
            <PolicyTab
              form={policyForm}
              update={updatePolicy}
            />
          )}
        </div>

        {/* Save Button - Fixed at bottom */}
        <div className="sticky bottom-6 mt-8 flex justify-end">
          <button
            onClick={save}
            disabled={saving || uploading || autoFavoritesLoading}
            className="px-8 py-4 rounded-xl bg-[#7B2220] text-white font-semibold hover:bg-[#8B3230] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 text-lg"
            type="button"
          >
            {saving ? (
              <>
                <Loading
                  message="Saving..."
                  size="text-xl"
                />
              </>
            ) : (
              <>
                <span>💾</span>
                <span>
                  {activeTab === "home"
                    ? "Save Home"
                    : activeTab === "policy"
                    ? "Save Policy & Ads"
                    : "Save Changes"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
