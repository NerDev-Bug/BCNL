import { useParams, Link, useNavigate } from "react-router-dom"
import { useEffect, useState, useMemo } from "react"
import { db, auth } from "../firebase"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  setDoc,
  serverTimestamp,
} from "firebase/firestore"
import { Search } from "lucide-react"
import { useCart } from "../context/CartContext"

// ✅ Toastify (COPY SAME AS MENU)
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [search, setSearch] = useState("")
  const navigate = useNavigate()
  const { addToCart } = useCart()

  // ✅ Controlled form (Custom Cakes only)
  const [customForm, setCustomForm] = useState({
    deliveryDate: "", // ISO date string e.g. "2026-01-20"
    deliveryTime: "", // e.g. "11AM - 1PM"
    quantity: 1,
    size: "REGULAR",
    candles: "-", // or "" depending on your dropdown values
    cardMessage: "",
  })

  const isCustomCakes = useMemo(() => {
    return (product?.category || "").trim().toLowerCase() === "custom cakes"
  }, [product])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!search.trim()) return
    navigate(`/menu?search=${encodeURIComponent(search.trim())}`)
  }

  const filteredRelated = relatedProducts.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  )

  // ✅ Add to wishlist (same logic + same toasts as Menu.jsx)
  const addToWishlist = async (prod) => {
    const user = auth.currentUser

    if (!user) {
      toast.info("Please login to add items to wishlist ❤️")
      window.openLoginModal?.()
      return
    }

    const saved = JSON.parse(localStorage.getItem("wishlist")) || []
    const exists = saved.some((p) => p.id === prod.id)

    if (exists) {
      toast.info("Already in your wishlist 💖")
      return
    }

    const updated = [...saved, prod]
    localStorage.setItem("wishlist", JSON.stringify(updated))

    try {
      const wishRef = doc(db, "users", user.uid, "wishlist", prod.id)
      await setDoc(
        wishRef,
        {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          image: prod.image,
          category: prod.category || "",
          available: prod.available ?? true,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )

      toast.success("Added to wishlist ❤️")
    } catch (err) {
      console.error("Add to wishlist failed:", err)
      toast.error("Failed to add to wishlist 😢")
    }
  }

  // ✅ Helpers for controlled form
  const updateCustomForm = (patch) => {
    setCustomForm((prev) => ({ ...prev, ...patch }))
  }

  const incQty = () => {
    updateCustomForm({ quantity: Math.min(99, (customForm.quantity || 1) + 1) })
  }

  const decQty = () => {
    updateCustomForm({ quantity: Math.max(1, (customForm.quantity || 1) - 1) })
  }

  const applyPreset = (type) => {
    // You can change these templates anytime
    const presets = {
      Birthday: "Happy Birthday, [Name]! 🎂",
      Romance: "I love you, [Name] ❤️",
      Anniversary: "Happy Anniversary, [Name] 💕",
      "Get well soon": "Get well soon, [Name] 🌷",
      Apology: "I’m sorry, [Name]. Please forgive me.",
    }

    const next = presets[type] || ""
    updateCustomForm({ cardMessage: next })
  }

  // ✅ Order Now
  const handleOrderNow = () => {
    if (!product) return

    // If Custom Cakes, require selections
    if (isCustomCakes) {
      if (!customForm.deliveryDate) {
        toast.info("Please select a delivery date 📅")
        return
      }
      if (!customForm.deliveryTime) {
        toast.info("Please select a delivery time ⏰")
        return
      }
      if (!customForm.cardMessage.trim()) {
        toast.info("Please write a card message 💌")
        return
      }
      if (customForm.cardMessage.trim().split(/\s+/).length > 250) {
        toast.info("Card message must be 250 words max ✍️")
        return
      }
    }

    // Merge customization into the cart item ONLY for Custom Cakes
    const cartItem = isCustomCakes
      ? {
          ...product,
          customization: {
            deliveryDate: customForm.deliveryDate,
            deliveryTime: customForm.deliveryTime,
            quantity: customForm.quantity,
            size: customForm.size,
            candles: customForm.candles,
            cardMessage: customForm.cardMessage,
          },
        }
      : product

    const success = addToCart(cartItem)

    if (!success) {
      toast.info("Please login to place an order 🛒")
      window.openLoginModal?.()
      return
    }

    toast.success("Added to cart 🛒")
  }

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      const docRef = doc(db, "products", id)
      const snap = await getDoc(docRef)
      if (!snap.exists()) return

      const current = { id: snap.id, ...snap.data() }
      setProduct(current)

      // ✅ reset form defaults when switching products
      setCustomForm({
        deliveryDate: "",
        deliveryTime: "",
        quantity: 1,
        size: "REGULAR",
        candles: "-",
        cardMessage: "",
      })

      if (!current.category) {
        setRelatedProducts([])
        return
      }

      const q = query(
        collection(db, "products"),
        where("category", "==", current.category),
        limit(10)
      )

      const relSnap = await getDocs(q)

      const sameCategory = relSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.id !== current.id)
        .slice(0, 3)

      setRelatedProducts(sameCategory)
    }

    fetchProductAndRelated()
  }, [id])

  if (!product) {
    return <div className="text-center py-20">Loading...</div>
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex items-center"
      style={{ backgroundImage: `url('/images/gingham_pattern_purple_bg.jpg')` }}
    >
      {/* ✅ ToastContainer (COPY SAME AS MENU) */}
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        theme="light"
      />

      <div className="max-w-6xl mx-auto px-3 pt-16 w-full">
        {/* TOP BAR (breadcrumb + search) */}
        <div className="bg-white border-2 border-black rounded-sm px-4 py-3 flex items-center gap-3 w-full">
          {/* CLICKABLE BREADCRUMB */}
          <p className="text-sm text-gray-700 flex-1 truncate">
            <Link to="/menu" className="hover:underline hover:text-black">
              Menu
            </Link>

            <span className="mx-1">{">"}</span>

            <Link
              to={`/menu?category=${encodeURIComponent(product.category || "")}`}
              className="hover:underline hover:text-black"
            >
              {product.category || "category"}
            </Link>

            <span className="mx-1">{">"}</span>

            <span className="font-medium text-black">{product.name}</span>
          </p>

          {/* FUNCTIONAL SEARCH */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search related..."
              className="w-full border border-black rounded-sm pl-10 pr-3 py-2 outline-none"
            />
          </form>
        </div>

        {/* MAIN CARD */}
        <div className="mt-3 bg-white border-[3px] border-black p-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* LEFT IMAGE */}
            <div className="flex justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] rounded-xl border border-gray-300 object-cover"
              />
            </div>

            {/* RIGHT INFO */}
            <div className="text-center md:text-left text-[#7B2220]">

              {/* TITLE */}
              <h1 className="text-4xl font-extrabold text-center md:text-left">
                {product.name}
              </h1>

              {/* DESCRIPTION */}
              <p className="text-sm text-center md:text-left mt-4 leading-relaxed max-w-md md:mx-0 mx-auto">
                {product.description || "No description available."}
              </p>

              {/* PRICE */}
              <p className="text-sm font-bold text-right mt-2 max-w-md md:ml-0 mx-auto">
                ₱{product.price}
              </p>

              {/* ✅ CUSTOM CAKES CONTROLLED FORM (only shows if category is Custom Cakes) */}
              {isCustomCakes && (
                <div className="mt-6 border border-black rounded-sm p-4 text-left text-black">
                  <p className="text-xs font-bold mb-2 text-[#7B2220]">
                    Custom Cakes Details
                  </p>

                  {/* Delivery Date */}
                  <label className="block text-xs font-semibold mb-1">
                    Select delivery date
                  </label>
                  <input
                    type="date"
                    value={customForm.deliveryDate}
                    onChange={(e) => updateCustomForm({ deliveryDate: e.target.value })}
                    className="w-full border border-black rounded-sm px-3 py-2 outline-none"
                  />

                  {/* Delivery Time */}
                  <label className="block text-xs font-semibold mt-4 mb-2">
                    Select delivery time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["11AM - 1PM", "1PM - 3PM", "3PM - 5PM", "5PM - 7PM"].map(
                      (t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateCustomForm({ deliveryTime: t })}
                          className={`border border-black rounded-sm px-2 py-2 text-xs ${
                            customForm.deliveryTime === t ? "bg-black text-white" : ""
                          }`}
                        >
                          {t}
                        </button>
                      )
                    )}
                  </div>

                  {/* Quantity */}
                  <label className="block text-xs font-semibold mt-4 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={decQty}
                      className="w-10 h-10 border border-black rounded-sm font-bold"
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={customForm.quantity}
                      onChange={(e) =>
                        updateCustomForm({
                          quantity: Math.max(1, Math.min(99, Number(e.target.value || 1))),
                        })
                      }
                      className="w-20 text-center border border-black rounded-sm px-2 py-2 outline-none"
                    />

                    <button
                      type="button"
                      onClick={incQty}
                      className="w-10 h-10 border border-black rounded-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Size + Candles */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Size</label>
                      <select
                        value={customForm.size}
                        onChange={(e) => updateCustomForm({ size: e.target.value })}
                        className="w-full border border-black rounded-sm px-3 py-2 outline-none"
                      >
                        <option value="REGULAR">REGULAR</option>
                        <option value="LARGE">LARGE</option>
                        <option value="XL">XL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Candles (FOC)
                      </label>
                      <select
                        value={customForm.candles}
                        onChange={(e) => updateCustomForm({ candles: e.target.value })}
                        className="w-full border border-black rounded-sm px-3 py-2 outline-none"
                      >
                        <option value="-">-</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                  </div>

                  {/* Card Message */}
                  <label className="block text-xs font-semibold mt-4 mb-1">
                    Card message (max 250 words)
                  </label>
                  <textarea
                    value={customForm.cardMessage}
                    onChange={(e) => updateCustomForm({ cardMessage: e.target.value })}
                    rows={4}
                    className="w-full border border-black rounded-sm px-3 py-2 outline-none"
                    placeholder="Include recipient’s name..."
                  />

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {["Birthday", "Romance", "Anniversary", "Get well soon", "Apology"].map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => applyPreset(p)}
                          className="border border-black rounded-sm px-2 py-2 text-xs"
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button
                  onClick={() => addToWishlist(product)}
                  className="w-44 border border-[#7B2220] text-[#7B2220] px-6 py-2 rounded-md hover:bg-[#7B2220]/5"
                >
                  Add to wishlist
                </button>

                <button
                  onClick={handleOrderNow}
                  className="w-44 bg-[#7B2220] text-white px-6 py-2 rounded-md hover:opacity-95"
                >
                  Order Now
                </button>
              </div>

              {/* RELATED */}
              <div className="mt-8">
                <p className="text-sm text-[#7B2220] text-center md:text-left mb-3">
                  Related Products
                </p>

                <div className="flex items-center justify-center md:justify-start gap-6">
                  {filteredRelated.length ? (
                    filteredRelated.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-lg border border-gray-400 overflow-hidden bg-white cursor-pointer hover:scale-105 hover:border-[#7B2220] transition-all"
                        title={p.name}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">
                      No related products found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  )
}
