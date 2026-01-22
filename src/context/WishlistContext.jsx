import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot } from "firebase/firestore"

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    let unsubWishlist = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // cleanup old listener
      if (unsubWishlist) {
        unsubWishlist()
        unsubWishlist = null
      }

      if (!user) {
        setWishlist([])
        localStorage.removeItem("wishlist")
        return
      }

      const colRef = collection(db, "users", user.uid, "wishlist")

      unsubWishlist = onSnapshot(
        colRef,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setWishlist(items)
          localStorage.setItem("wishlist", JSON.stringify(items))
        },
        (err) => {
          console.error("Wishlist listener error:", err)
          const local = JSON.parse(localStorage.getItem("wishlist")) || []
          setWishlist(local)
        }
      )
    })

    return () => {
      if (unsubWishlist) unsubWishlist()
      unsubAuth()
    }
  }, [])

  const value = useMemo(() => {
    const wishlistIds = wishlist.map((w) => w.id)
    return {
      wishlist,
      wishlistIds,
      wishlistCount: wishlist.length,
    }
  }, [wishlist])

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider")
  return ctx
}
