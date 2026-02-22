import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { applyDiscount, formatDiscount } from "../utils/price"
import { Search } from "lucide-react"
import { db, auth } from "../firebase"
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useCart } from "../context/CartContext"
import { flyToCart } from "../utils/flyToCart"
import ProductSkeleton from "../context/ProductSkeleton"
import PolicyAdsModal from "../components/modals/PolicyAdsModal"
import { toggleWishlist } from "../utils/wishlist"
import StarRating from "../components/common/StarRating"

export default function Menu() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState(() => searchParams.get("search") || "")
  const [category, setCategory] = useState(() => searchParams.get("category") || "All Categories")
  const { addToCart } = useCart()
  const [loading, setLoading] = useState(true)
  const [wishlistIds, setWishlistIds] = useState([])
  const [showAd, setShowAd] = useState(false)
  const [productRatings, setProductRatings] = useState({}) // { productId: { average: number, count: number } }

  useEffect(() => {
    const hasSeenMenuAd = localStorage.getItem("menuAdSeen")
    if (!hasSeenMenuAd) setShowAd(true)
  }, [])

  const handleCloseAd = () => {
    localStorage.setItem("menuAdSeen", "true")
    setShowAd(false)
  }

  // Fetch product ratings in parallel with Promise.all
  const fetchProductRatings = async (productIds) => {
    const entries = await Promise.all(
      productIds.map(async (productId) => {
        try {
          const reviewsSnap = await getDocs(collection(db, "products", productId, "reviews"))
          const reviews = reviewsSnap.docs.map((d) => d.data())
          if (reviews.length > 0) {
            const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0)
            return [productId, { average: sum / reviews.length, count: reviews.length }]
          }
          return [productId, { average: 0, count: 0 }]
        } catch {
          return [productId, { average: 0, count: 0 }]
        }
      })
    )
    setProductRatings(Object.fromEntries(entries))
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // ✅ ONLY show products admin marked for menu
        const q = query(
          collection(db, "products"),
          where("showOnMenu", "==", true)
        )

        const snap = await getDocs(q)
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setProducts(data)

        const uniqueCats = Array.from(
          new Set(data.map((p) => (p.category || "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b))

        setCategories(uniqueCats)

        // ✅ Fetch ratings only for shown products
        const productIds = data.map((p) => p.id)
        await fetchProductRatings(productIds)
      } catch (err) {
        console.error("Failed to fetch products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    let unsubWishlist = null
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubWishlist) unsubWishlist()
      if (!user) return setWishlistIds([])

      const colRef = collection(db, "users", user.uid, "wishlist")
      unsubWishlist = onSnapshot(colRef, (snap) => {
        const ids = snap.docs.map((d) => d.id)
        setWishlistIds(ids)
      })
    })

    return () => {
      if (unsubWishlist) unsubWishlist()
      unsubAuth()
    }
  }, [])

  return (
    <div className="w-full">
      {showAd && <PolicyAdsModal onClose={handleCloseAd} />}

      <div
        className="w-full border-y-2 border-black min-h-[250px] flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/menubanner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-[#502455] font-cooper translate-y-8">
          Menu
        </h1>
      </div>

      <div
        className="bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/images/gingham_pattern_purple_bg.jpg')" }}
      >
        <div className="py-8 px-4 max-w-6xl mx-auto">
          <div
  className="border border-[#7B2220] rounded-md p-2 bg-[#502455] z-20 md:sticky"
  style={{ top: "100px" }}
>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={18}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 py-2 border rounded-md"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full md:w-56 px-4 py-2 border rounded-md"
              >
                <option>All Categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <ProductSkeleton count={3} />
            ) : (() => {
              const filtered = products
                .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                .filter((p) => category === "All Categories" ? true : p.category === category);

              if (filtered.length === 0) {
                return (
                  <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
                    <div className="text-6xl mb-4">🍰</div>
                    <h3 className="text-xl font-bold text-[#502455] mb-2">
                      {search || category !== "All Categories" ? "No products found" : "No products available today"}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                      {search || category !== "All Categories"
                        ? "Try a different search or category."
                        : "Check back soon — the baker is working on something delicious!"}
                    </p>
                    {(search || category !== "All Categories") && (
                      <button
                        onClick={() => { setSearch(""); setCategory("All Categories"); }}
                        className="mt-4 px-4 py-2 rounded-lg border border-[#7B2220] text-[#7B2220] text-sm hover:bg-[#7B2220] hover:text-white transition"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                );
              }

              return filtered.map((product) => {
                  const isWishlisted = wishlistIds.includes(product.id)

                  return (
                    <div
                      key={product.id}
                      className="group bg-white border border-[#7B2220] rounded-md shadow-md"
                    >
                      <div className="p-4">
                        <div className="relative">
                          {product.available ? (
                            <Link to={`/product/${product.id}`}>
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-80 object-cover"
                              />
                            </Link>
                          ) : (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-80 object-cover opacity-60"
                            />
                          )}

                          {!product.available && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/60 text-white font-bold px-4 py-2 rounded-md text-center">
                                Not available today
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-6 pb-6">
                        <h3 className="text-center font-semibold text-[#7B2220] font-cooper">
                          {product.name}
                        </h3>

                        {/* ⭐ Rating Stars */}
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <StarRating
                            rating={productRatings[product.id]?.average || 0}
                            interactive={false}
                            size="xs"
                            color="primary"
                          />
                          {productRatings[product.id]?.count > 0 && (
                            <span className="text-xs text-gray-600">
                              ({productRatings[product.id].average.toFixed(1)})
                            </span>
                          )}
                        </div>

                        {(() => {
                          const finalPrice = applyDiscount(product.price, product.productDiscount);
                          const discountLabel = formatDiscount(product.productDiscount);
                          const hasDiscount = discountLabel && finalPrice < Number(product.price || 0);
                          return (
                            <div className="text-center mt-2">
                              {hasDiscount && (
                                <span className="inline-block bg-red-100 text-red-700 text-[0.65rem] font-bold px-2 py-0.5 rounded-full mb-1">
                                  {discountLabel}
                                </span>
                              )}
                              <p className="font-semibold text-[#7B2220]">
                                €{finalPrice.toFixed(2)}
                                {hasDiscount && (
                                  <span className="ml-2 text-xs text-gray-400 line-through font-normal">
                                    €{Number(product.price).toFixed(2)}
                                  </span>
                                )}
                              </p>
                            </div>
                          );
                        })()}

                        <div className="mt-4 flex gap-4">
                          <button
                            onClick={() => toggleWishlist(product, wishlistIds)}
                            className={`flex-1 rounded-md py-2 font-semibold transition-all
                              ${
                                isWishlisted
                                  ? "bg-[#502455] text-white border border-[#502455]"
                                  : "border border-[#502455] text-[#502455] hover:bg-[#502455] hover:text-white"
                              }
                            `}
                          >
                            {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                          </button>

                          {(product.category || "").trim() === "Custom Cakes" ? (
                            product.available ? (
                              <Link
                                to={`/product/${product.id}`}
                                className="flex-1 text-center rounded-md py-2 font-bold bg-[#7B2220] text-white hover:bg-[#502455]"
                              >
                                Customize
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="flex-1 text-center rounded-md py-2 font-bold bg-gray-300 text-gray-600 cursor-not-allowed"
                              >
                                Customize
                              </button>
                            )
                          ) : (
                            <button
                              disabled={!product.available}
                              onClick={(e) => {
                                if (!product.available) return
                                const img = e.currentTarget
                                  .closest(".group")
                                  .querySelector("img")
                                const discountedPrice = applyDiscount(product.price, product.productDiscount);
                                const success = addToCart({ ...product, price: discountedPrice })
                                if (!success) return window.openLoginModal?.()
                                flyToCart(img)
                              }}
                              className={`flex-1 rounded-md py-2 font-bold text-white
                                ${
                                  product.available
                                    ? "bg-[#7B2220] hover:bg-[#502455]"
                                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                }
                              `}
                            >
                              Order Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                });
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
