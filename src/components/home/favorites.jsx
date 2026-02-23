import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase"
import { useCart } from "../../context/CartContext"
import { flyToCart } from "../../utils/flyToCart"
import ProductSkeleton from "../../context/ProductSkeleton"
import { toggleWishlist } from "../../utils/wishlist"
import { applyDiscount, formatDiscount } from "../../utils/price"
import StarRating from "../common/StarRating"

function Favorites() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistIds, setWishlistIds] = useState([])
  const [productRatings, setProductRatings] = useState({})

  const fetchRatings = async (productIds) => {
    const entries = await Promise.all(
      productIds.map(async (productId) => {
        try {
          const snap = await getDocs(collection(db, "products", productId, "reviews"))
          const reviews = snap.docs.map((d) => d.data())
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
    const fetchFavorites = async () => {
      try {
        // 1) get admin-selected IDs
        const pageSnap = await getDoc(doc(db, "pages", "ourStory"))
        const ids = Array.isArray(pageSnap.data()?.favoritesProductIds)
          ? pageSnap.data().favoritesProductIds.filter(Boolean)
          : []

        // 2) if admin didn't pick yet, fallback to random 3
        if (ids.length === 0) {
          const snap = await getDocs(collection(db, "products"))
          const allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          const shuffled = allProducts.sort(() => 0.5 - Math.random())
          const chosen = shuffled.slice(0, 3)
          setProducts(chosen)
          fetchRatings(chosen.map((p) => p.id))
          return
        }

        // 3) fetch products and keep the chosen order
        const snap = await getDocs(collection(db, "products"))
        const allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

        const byId = new Map(allProducts.map((p) => [p.id, p]))
        const picked = ids.map((id) => byId.get(id)).filter(Boolean).slice(0, 3)

        setProducts(picked)
        fetchRatings(picked.map((p) => p.id))
      } catch (err) {
        console.error("Failed to load favorites", err)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  return (
    <div
      className="bg-cover bg-center"
      style={{ backgroundImage: `url('/images/gingham_pattern_purple_bg.jpg')` }}
    >
      <div className="py-8 px-4 max-w-6xl mx-auto relative">
        <h1 className="text-4xl font-bold text-[#502455] font-cooper text-center pt-20 md:pt-0">
          Favorites
        </h1>

        <Link
          to="/menu"
          className="absolute left-6 top-8 bg-[#7a2d2d] text-white rounded-md px-4 py-2 text-sm flex items-center gap-2 hover:opacity-90"
        >
          This Week&apos;s Bakes
          <span className="ml-1 bg-[#7a2d2d] rounded-sm w-6 h-6 flex items-center justify-center shadow-sm">
            <img src="./images/Farword-Arrow.png" alt="" className="w-4 h-3" />
          </span>
        </Link>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <ProductSkeleton count={3} />
          ) : (
            products.map((p) => {
              const isWishlisted = wishlistIds.includes(p.id)
              const finalPrice = applyDiscount(p.price, p.productDiscount)
              const discountLabel = formatDiscount(p.productDiscount)
              const hasAnyPromo = !!discountLabel
              const showStrikethrough = hasAnyPromo && finalPrice < Number(p.price || 0)
              const rating = productRatings[p.id]

              return (
                <div
                  key={p.id}
                  className="group bg-white border border-[#7B2220] rounded-md shadow-md flex flex-col"
                >
                  <div className="p-4">
                    <Link to={`/product/${p.id}`} className="block">
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-80 object-cover cursor-pointer"
                        />
                      </div>
                    </Link>
                  </div>

                  <div className="px-6 pb-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-center text-lg font-semibold text-[#7B2220]">
                        {p.name}
                      </h3>

                      {/* Star Rating */}
                      <div className="flex items-center justify-center gap-1.5 mt-1.5">
                        <StarRating
                          rating={rating?.average || 0}
                          interactive={false}
                          size="sm"
                          color="primary"
                        />
                        {rating?.count > 0 && (
                          <span className="text-xs text-gray-500">
                            ({rating.average.toFixed(1)})
                          </span>
                        )}
                      </div>

                      {/* Badge + Price in one row */}
                      <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                        {hasAnyPromo && (
                          <span className="inline-block bg-red-100 text-red-600 text-[0.65rem] font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                            {discountLabel}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-[#7B2220]">
                          €{finalPrice.toFixed(2)}
                          {showStrikethrough && (
                            <span className="ml-1.5 text-xs text-gray-400 line-through font-normal">
                              €{Number(p.price).toFixed(2)}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-4">
                      <button
                        onClick={() => toggleWishlist(p, wishlistIds, setWishlistIds)}
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

                      <button
                        onClick={(e) => {
                          const img = e.currentTarget.closest(".group").querySelector("img")
                          const success = addToCart({ ...p, price: finalPrice, originalPrice: p.productDiscount ? Number(p.price) : null, productDiscount: p.productDiscount || null })
                          if (!success) return window.openLoginModal?.()
                          flyToCart(img)
                        }}
                        className="flex-1 rounded-md py-2 font-bold bg-[#7B2220] text-white hover:bg-[#502455]"
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Favorites
