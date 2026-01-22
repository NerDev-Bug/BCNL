import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"
import { db, auth } from "../firebase"
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useCart } from "../context/CartContext"
import { flyToCart } from "../utils/flyToCart"

// ✅ Toastify
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function Menu() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All Categories")
  const { addToCart } = useCart()

  // ✅ Realtime wishlist ids
  const [wishlistIds, setWishlistIds] = useState([])

  /* ---------------- FETCH PRODUCTS ---------------- */
  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, "products"))
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setProducts(data)

      const uniqueCats = Array.from(
        new Set(data.map((p) => (p.category || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b))

      setCategories(uniqueCats)
    }

    fetchProducts()
  }, [])

  /* ---------------- REALTIME WISHLIST ---------------- */
  useEffect(() => {
    let unsubWishlist = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // cleanup old listener
      if (unsubWishlist) {
        unsubWishlist()
        unsubWishlist = null
      }

      if (!user) {
        setWishlistIds([])
        return
      }

      const colRef = collection(db, "users", user.uid, "wishlist")
      unsubWishlist = onSnapshot(
        colRef,
        (snap) => {
          const ids = snap.docs.map((d) => d.id)
          setWishlistIds(ids)
        },
        (err) => {
          console.error("Wishlist realtime error:", err)
        }
      )
    })

    return () => {
      if (unsubWishlist) unsubWishlist()
      unsubAuth()
    }
  }, [])

  /* ---------------- TOGGLE WISHLIST ---------------- */
  const toggleWishlist = async (product) => {
    const user = auth.currentUser
    if (!user) {
      toast.info("Please login ❤️")
      window.openLoginModal?.()
      return
    }

    const ref = doc(db, "users", user.uid, "wishlist", product.id)
    const isWishlisted = wishlistIds.includes(product.id)

    try {
      if (isWishlisted) {
        await deleteDoc(ref)
        toast.info("Removed from wishlist ❤️")
      } else {
        await setDoc(ref, {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          available: product.available,
          createdAt: serverTimestamp(),
        })
        toast.success("Added to wishlist ❤️")
      }
      // ✅ no manual setWishlistIds needed — onSnapshot updates automatically
    } catch (err) {
      console.error("Toggle wishlist failed:", err)
      toast.error("Wishlist failed ❌")
    }
  }

  return (
    <div className="w-full">
      {/* ---------------- BANNER ---------------- */}
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

      {/* ---------------- CONTENT ---------------- */}
      <div
        className="bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/images/gingham_pattern_purple_bg.jpg')" }}
      >
        <div className="py-8 px-4 max-w-6xl mx-auto">
          {/* SEARCH + CATEGORY */}
          <div
            className="border border-[#7B2220] rounded-md p-2 bg-[#502455] sticky z-20"
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

          {/* ---------------- PRODUCTS ---------------- */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {products
              .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
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
                      <Link to={`/product/${product.id}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`w-full h-80 object-cover ${
                            !product.available ? "opacity-60" : ""
                          }`}
                        />
                      </Link>
                    </div>

                    <div className="px-6 pb-6">
                      <h3 className="text-center font-semibold text-[#7B2220]">
                        {product.name}
                      </h3>
                      <p className="text-center mt-2">₱{product.price}</p>

                      <div className="mt-4 flex gap-4">
                        <button
  onClick={() => toggleWishlist(product)}
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

                        {/* ✅ CUSTOM CAKES LOGIC */}
                        {(product.category || "").trim() === "Custom Cakes" ? (
                          <Link
                            to={`/product/${product.id}`}
                            className="flex-1 text-center rounded-md py-2 font-bold bg-[#7B2220] text-white hover:bg-[#502455]"
                          >
                            Customize
                          </Link>
                        ) : (
                          <button
                            onClick={(e) => {
                              const img = e.currentTarget
                                .closest(".group")
                                .querySelector("img")

                              const success = addToCart(product)
                              if (!success) {
                                toast.info("Please login 🛒")
                                window.openLoginModal?.()
                                return
                              }

                              toast.success("Added to cart 🛒")
                              flyToCart(img)
                            }}
                            className="flex-1 rounded-md py-2 font-bold bg-[#7B2220] text-white hover:bg-[#502455]"
                          >
                            Order Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
