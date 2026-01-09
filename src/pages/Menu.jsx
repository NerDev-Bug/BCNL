import { useState, useEffect } from "react";
import { Heart, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Cart from "../components/Cart";

import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const products = [
  { id: 1, name: "Chocolate Cake", price: 550, image: "/images/chocolate_cake.jpg" },
  { id: 2, name: "Ube - White Chocolate Cookies", price: 550, image: "/images/ube-white_chocolate_cookies.jpg" },
  { id: 3, name: "Silvanas", price: 550, image: "/images/silvanas.jpg" },
];

export default function Menu() {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const auth = getAuth();

  // 🔹 Load cart from LocalStorage
  useEffect(() => {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  // 🔹 Save cart to LocalStorage
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // 🔹 Auto-close cart when empty
  useEffect(() => {
    if (cartItems.length === 0) {
      setCartOpen(false);
    }
  }, [cartItems]);

  // 🔹 Sync cart to Firebase
  useEffect(() => {
    const syncCart = async () => {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(
        doc(db, "users", user.uid),
        { cartItems },
        { merge: true }
      );
    };

    if (cartItems.length > 0) {
      syncCart();
    }
  }, [cartItems]);

  const handleAddToCart = (product) => {
    const existing = cartItems.find((item) => item.id === product.id);

    if (existing) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems((prev) => [...prev, { ...product, quantity: 1 }]);
    }

    setCartOpen(true);
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  return (
    <div className="w-full">

      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
}
