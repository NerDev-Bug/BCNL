import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../firebase"
import { toast } from "react-toastify"

/**
 * Toggle a product in the user's wishlist.
 * 
 * @param {Object} product - Product object (id, name, price, image, category, available)
 * @param {Array} wishlistIds - Current wishlist IDs
 * @param {Function} setWishlistIds - Optional setter for local wishlist state
 */
export async function toggleWishlist(product, wishlistIds = [], setWishlistIds) {
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
      toast.info(`Removed "${product.name}" from wishlist ❤️`) // ← updated
      if (setWishlistIds) setWishlistIds((prev) => prev.filter((id) => id !== product.id))
    } else {
      await setDoc(ref, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category || "",
        available: product.available ?? true,
        createdAt: serverTimestamp(),
      })
      toast.success(`Added "${product.name}" to wishlist ❤️`) // ← updated
      if (setWishlistIds) setWishlistIds((prev) => [...prev, product.id])
    }
  } catch (err) {
    console.error("Toggle wishlist failed:", err)
    toast.error(`Wishlist failed for "${product.name}" ❌`) // ← updated
  }
}
