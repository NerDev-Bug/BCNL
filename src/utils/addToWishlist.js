import { auth, db } from "../firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "react-toastify"

export const addToWishlist = async (product) => {
  const user = auth.currentUser

  if (!user) {
    toast.info("Please login to add items to wishlist ❤️")
    window.openLoginModal?.()
    return
  }

  const saved = JSON.parse(localStorage.getItem("wishlist")) || []
  const exists = saved.some((p) => p.id === product.id)

  if (exists) {
    toast.info("Already in your wishlist 💖")
    return
  }

  localStorage.setItem("wishlist", JSON.stringify([...saved, product]))

  try {
    const wishRef = doc(db, "users", user.uid, "wishlist", product.id)

    await setDoc(
      wishRef,
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category || "",
        available: product.available ?? true,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    )

    toast.success("Added to wishlist ❤️")
  } catch (err) {
    console.error(err)
    toast.error("Failed to add to wishlist 😢")
  }
}
