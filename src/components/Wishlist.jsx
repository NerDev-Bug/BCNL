import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { db, auth } from "../firebase"
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

function Wishlist() {
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // ✅ if you want wishlist to disappear after logout:
        setWishlist([])
        localStorage.removeItem("wishlist")
        return
      }

      const local = JSON.parse(localStorage.getItem("wishlist")) || []

      try {
        const snap = await getDocs(collection(db, "users", user.uid, "wishlist"))
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setWishlist(items)
        localStorage.setItem("wishlist", JSON.stringify(items))
      } catch (err) {
        console.error("Failed to load wishlist from Firestore:", err)
        setWishlist(local)
      }
    })

    return () => unsub()
  }, [])

  async function removeFromWishlist(id) {
    const updated = wishlist.filter((item) => item.id !== id)
    setWishlist(updated)
    localStorage.setItem("wishlist", JSON.stringify(updated))

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
        {wishlist.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                <Link to={`/product/${item.id}`} className="block">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded cursor-pointer"
                  />
                </Link>

                <h3 className="mt-3 font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">₱{item.price}</p>

                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="mt-3 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Wishlist
