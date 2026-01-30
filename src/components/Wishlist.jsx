import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { db, auth } from "../firebase"
import { collection, doc, deleteDoc, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import ProductSkeleton from "../context/ProductSkeleton"
import { useCart } from "../context/CartContext"
import { flyToCart } from "../utils/flyToCart"

function Wishlist() {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    let unsubWishlist = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubWishlist) {
        unsubWishlist()
        unsubWishlist = null
      }

      if (!user) {
        setWishlist([])
        setLoading(false)
        localStorage.removeItem("wishlist")
        return
      }

      setLoading(true)

      const colRef = collection(db, "users", user.uid, "wishlist")
      unsubWishlist = onSnapshot(
        colRef,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setWishlist(items)
          setLoading(false)
          localStorage.setItem("wishlist", JSON.stringify(items))
        },
        (err) => {
          console.error("Wishlist realtime listener failed:", err)
          const local = JSON.parse(localStorage.getItem("wishlist")) || []
          setWishlist(local)
          setLoading(false)
        }
      )
    })

    return () => {
      if (unsubWishlist) unsubWishlist()
      unsubAuth()
    }
  }, [])

  async function removeFromWishlist(id) {
    const user = auth.currentUser
    if (!user) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "wishlist", id))
    } catch (err) {
      console.error("Remove from wishlist failed:", err)
    }
  }

  return (
    <div
      className="pt-32 min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/wishlist-bg.png')",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 flex justify-center">
        {/* ✅ EMPTY STATE FIRST */}
        {!loading && wishlist.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 text-center shadow-lg w-full md:w-2/3">
            <img
              src="./images/favorite-empty.png"
              alt="Empty wishlist"
              className="w-20 h-20 mx-auto opacity-60"
            />
            <p className="mt-8 text-2xl font-semibold text-[#7B2220]">
              Wishlist is empty
            </p>
            <p className="mt-4 text-base text-gray-500">
              You don't have any products in the wishlist yet.
              <br />
              You will find a lot of interesting products on our{" "}
              <Link to="/menu" className="text-[#7B2220] underline font-medium">
                Menu
              </Link>
              .
            </p>
          </div>
        ) : loading ? (
          /* ✅ SKELETON */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <ProductSkeleton count={wishlist.length || 3} />
          </div>
        ) : (
          /* ✅ SAME UI AS MENU CARDS + UNAVAILABLE BEHAVIOR */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {wishlist.map((item) => {
              const isAvailable = item.available !== false

              return (
                <div
                  key={item.id}
                  className="group bg-white border border-[#7B2220] rounded-md shadow-md"
                >
                  <div className="p-4">
                    <div className="relative">
                      {isAvailable ? (
                        <Link to={`/product/${item.id}`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-80 object-cover"
                          />
                        </Link>
                      ) : (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-80 object-cover opacity-60"
                        />
                      )}

                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/60 text-white font-bold px-4 py-2 rounded-md text-center">
                            Not available today
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <h3 className="text-center font-semibold text-[#7B2220]">
                      {item.name}
                    </h3>
                    <p className="text-center mt-2">€{item.price}</p>

                    <div className="mt-4 flex gap-4">
                      {/* ✅ REMOVE BUTTON */}
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="flex-1 rounded-md py-2 font-semibold transition-all border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        Remove
                      </button>

                      {/* ✅ ADD TO CART (DISABLED IF NOT AVAILABLE) */}
                      <button
                        disabled={!isAvailable}
                        onClick={(e) => {
                          if (!isAvailable) return
                          const img = e.currentTarget
                            .closest(".group")
                            ?.querySelector("img")

                          const success = addToCart(item)
                          if (!success) return window.openLoginModal?.()
                          flyToCart(img)
                        }}
                        className={`flex-1 rounded-md py-2 font-bold
                          ${
                            isAvailable
                              ? "bg-[#7B2220] text-white hover:bg-[#502455]"
                              : "bg-gray-300 text-gray-600 cursor-not-allowed"
                          }
                        `}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Wishlist
