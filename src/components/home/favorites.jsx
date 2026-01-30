import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase"
import { useCart } from "../../context/CartContext"
import { flyToCart } from "../../utils/flyToCart"
import ProductSkeleton from "../../context/ProductSkeleton"
import { toggleWishlist } from "../../utils/wishlist"

function Favorites() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistIds, setWishlistIds] = useState([])

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // ✅ 1) get admin-selected IDs
        const pageSnap = await getDoc(doc(db, "pages", "ourStory"))
        const ids = Array.isArray(pageSnap.data()?.favoritesProductIds)
          ? pageSnap.data().favoritesProductIds.filter(Boolean)
          : []

        // ✅ 2) if admin didn’t pick yet, fallback to random 3
        if (ids.length === 0) {
          const snap = await getDocs(collection(db, "products"))
          const allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          const shuffled = allProducts.sort(() => 0.5 - Math.random())
          setProducts(shuffled.slice(0, 3))
          return
        }

        // ✅ 3) fetch products and keep the chosen order
        const snap = await getDocs(collection(db, "products"))
        const allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

        const byId = new Map(allProducts.map((p) => [p.id, p]))
        const picked = ids.map((id) => byId.get(id)).filter(Boolean)

        setProducts(picked.slice(0, 3))
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
          Go to Menu
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

              return (
                <div
                  key={p.id}
                  className="group bg-white border border-[#7B2220] rounded-md shadow-md flex flex-col"
                >
                  <div className="p-4">
                    <div className="relative border border-gray-200 rounded-md overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-80 object-cover"
                      />
                    </div>
                  </div>

                  <div className="px-6 pb-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-center text-lg font-semibold text-[#7B2220]">
                        {p.name}
                      </h3>
                      <p className="text-center text-sm font-semibold mt-2">
                        €{p.price}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-4">
                      <button
                        onClick={() =>
                          toggleWishlist(p, wishlistIds, setWishlistIds)
                        }
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
                          const img = e.currentTarget
                            .closest(".group")
                            .querySelector("img")
                          const success = addToCart(p)
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
