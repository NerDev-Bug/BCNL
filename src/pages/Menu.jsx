import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"
import { db, auth } from "../firebase"
import { collection, getDocs, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useCart } from "../context/CartContext"
import { flyToCart } from "../utils/flyToCart"
import ProductSkeleton from "../context/ProductSkeleton"
import { toggleWishlist } from "../utils/wishlist"

export default function Menu() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All Categories")
  const { addToCart } = useCart()
  const [loading, setLoading] = useState(true)
  const [wishlistIds, setWishlistIds] = useState([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"))
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setProducts(data)

        const uniqueCats = Array.from(
          new Set(data.map((p) => (p.category || "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b))

        setCategories(uniqueCats)
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
            className="border border-[#7B2220] rounded-md p-2 bg-[#502455] sticky z-20"
            style={{ top: "100px" }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
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
            ) : (
              products
                .filter((p) =>
                  p.name.toLowerCase().includes(search.toLowerCase())
                )
                .filter((p) =>
                  category === "All Categories" ? true : p.category === category
                )
                .map((product) => {
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
                        <p className="text-center mt-2">€{product.price}</p>

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
                                const img =
                                  e.currentTarget
                                    .closest(".group")
                                    .querySelector("img")
                                const success = addToCart(product)
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
                })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
