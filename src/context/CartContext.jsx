import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);

  // ✅ Needed by Navbar
  const [isCartOpen, setIsCartOpen] = useState(false);

  const auth = getAuth();

  // ✅ Track auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);

      // optional: clear cart on logout
      if (!u) {
        setCartItems([]);
        setIsCartOpen(false);
      }
    });
    return () => unsub();
  }, [auth]);

  // ✅ Load cart for the logged-in user
  useEffect(() => {
    if (!user) return;

    const loadCart = async () => {
      const colRef = collection(db, "users", user.uid, "cartItems");
      const snap = await getDocs(colRef);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCartItems(items);
    };

    loadCart();
  }, [user]);

  // --- Firestore helpers ---
  const itemDocRef = (uid, id) => doc(db, "users", uid, "cartItems", String(id));

  const upsertToFirestore = async (uid, item) => {
    await setDoc(
      itemDocRef(uid, item.id),
      {
        name: item.name,
        price: item.price,
        image: item.image || null,
        category: item.category || null,
        quantity: item.quantity,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  };

  const deleteFromFirestore = async (uid, id) => {
    await deleteDoc(itemDocRef(uid, id));
  };

  // CartContext.jsx
const addToCart = (product) => {
  if (!user) {
    return false; // 👈 tell caller login is required
  }

  setCartItems((prev) => {
    const existing = prev.find((i) => i.id === product.id);

    const next = existing
      ? prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: (i.quantity || 1) + 1 }
            : i
        )
      : [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || null,
            category: product.category || null,
            quantity: 1,
          },
        ];

    const itemToSave = next.find((i) => i.id === product.id);
    upsertToFirestore(user.uid, itemToSave).catch(console.error);

    return next;
  });

  return true; // 👈 success
};


  // ✅ Called by Cart.jsx via onUpdateQuantity
  const updateQuantity = (id, quantity) => {
    if (!user) return;
    if (!Number.isFinite(quantity) || quantity < 1) return;

    setCartItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, quantity } : i));
      const itemToSave = next.find((i) => i.id === id);
      if (itemToSave) upsertToFirestore(user.uid, itemToSave).catch(console.error);
      return next;
    });
  };

  // ✅ Called by Cart.jsx via onRemoveItem
  // (Matches your Navbar name: removeItem)
  const removeItem = (id) => {
    if (!user) return;

    setCartItems((prev) => prev.filter((i) => i.id !== id));
    deleteFromFirestore(user.uid, id).catch(console.error);
  };

  const value = useMemo( 
    () => ({
      cartItems,
      addToCart,
      updateQuantity,
      removeItem,

      // ✅ Navbar needs these
      isCartOpen,
      setIsCartOpen,

      user,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartItems, isCartOpen, user]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
