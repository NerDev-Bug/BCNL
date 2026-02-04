import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { db } from "../firebase"
import { collection, deleteDoc, doc, getDocs, setDoc, addDoc, serverTimestamp } from "firebase/firestore"

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [user, setUser] = useState(null)

  // ✅ Needed by Navbar
  const [isCartOpen, setIsCartOpen] = useState(false)

  const auth = getAuth()

  const createOrder = async (customerData) => {
  if (!user) throw new Error("Not authenticated")
  if (cartItems.length === 0) throw new Error("Cart is empty")

  const orderPayload = {
    userId: user.uid,
    userEmail: user.email || null,

    customer: {
      ...customerData, // name, address, phone, notes, etc
    },

    items: cartItems.map((item) => ({
      cartItemId: item.id,
      productId: item.productId || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization || null,
    })),

    totalPrice: cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),

    status: "paid", // initial status
    createdAt: serverTimestamp(),
  }

  // THIS CREATES THE `orders` COLLECTION
  const docRef = await addDoc(collection(db, "orders"), orderPayload)

  // Clear cart ONLY after order is saved
  await clearCart()

  return docRef.id
}


  // ✅ Track auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null)

      // optional: clear cart on logout
      if (!u) {
        setCartItems([])
        setIsCartOpen(false)
      }
    })
    return () => unsub()
  }, [auth])

  // ✅ Load cart for the logged-in user
  useEffect(() => {
    if (!user) return

    const loadCart = async () => {
      const colRef = collection(db, "users", user.uid, "cartItems")
      const snap = await getDocs(colRef)
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setCartItems(items)
    }

    loadCart()
  }, [user])

  // --- Firestore helpers ---
  const itemDocRef = (uid, id) => doc(db, "users", uid, "cartItems", String(id))

  // Build a stable unique key for customized items (Custom Cakes)
  const buildCartItemId = (product) => {
    // default: normal products use their product id
    if (!product?.customization) return String(product.id)

    const c = product.customization || {}

    // include fields that make it unique
    const keyParts = [
      product.id,
      c.deliveryDate || "",
      c.deliveryTime || "",
      c.size || "",
      c.candles || "",
      // cardMessage can be long; don’t use it in ID
    ]

    // sanitize + join
    return keyParts
      .map((v) => String(v).trim().replace(/\s+/g, "_"))
      .join("__")
  }

  const upsertToFirestore = async (uid, item) => {
    await setDoc(
      itemDocRef(uid, item.id),
      {
        name: item.name,
        price: item.price,
        image: item.image || null,
        category: item.category || null,
        quantity: item.quantity,
        customization: item.customization || null, // ✅ NEW
        updatedAt: Date.now(),
      },
      { merge: true }
    )
  }

  const deleteFromFirestore = async (uid, id) => {
    await deleteDoc(itemDocRef(uid, id))
  }

  // addToCart now supports custom items as separate lines
  const addToCart = (product) => {
    if (!user) return false // login required

    const cartItemId = buildCartItemId(product)

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === cartItemId)

      const next = existing
        ? prev.map((i) =>
            i.id === cartItemId
              ? { ...i, quantity: (i.quantity || 1) + 1 }
              : i
          )
        : [
            ...prev,
            {
              id: cartItemId, // unique per customization (or product id for normal)
              productId: String(product.id), // optional but useful
              name: product.name,
              price: product.price,
              image: product.image || null,
              category: product.category || null,
              quantity: product.customization?.quantity || 1, // use form quantity if provided
              customization: product.customization || null, // NEW
            },
          ]

      const itemToSave = next.find((i) => i.id === cartItemId)
      upsertToFirestore(user.uid, itemToSave).catch(console.error)

      return next
    })

    return true
  }

  // Called by Cart.jsx via onUpdateQuantity
  const updateQuantity = (id, quantity) => {
    if (!user) return
    if (!Number.isFinite(quantity) || quantity < 1) return

    setCartItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, quantity } : i))
      const itemToSave = next.find((i) => i.id === id)
      if (itemToSave) upsertToFirestore(user.uid, itemToSave).catch(console.error)
      return next
    })
  }

  // Called by Cart.jsx via onRemoveItem
  const removeItem = (id) => {
    if (!user) return

    setCartItems((prev) => prev.filter((i) => i.id !== id))
    deleteFromFirestore(user.uid, id).catch(console.error)
  }

  // Clear all cart items (called after order confirmation)
  const clearCart = async () => {
    if (!user) return

    try {
      const colRef = collection(db, "users", user.uid, "cartItems")
      const snap = await getDocs(colRef)
      
      // Delete all items in parallel
      await Promise.all(
        snap.docs.map(doc => deleteDoc(doc.ref))
      )

      setCartItems([])
      setIsCartOpen(false)
    } catch (err) {
      console.error("Error clearing cart:", err)
    }
  }

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart, // NEW

       createOrder, // ADD THIS

      // Navbar needs these
      isCartOpen,
      setIsCartOpen,

      user,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartItems, isCartOpen, user]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}
