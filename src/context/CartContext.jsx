/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"

const CartContext = createContext()

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Load cart
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem("cartItems")
    return stored ? JSON.parse(stored) : []
  })


  // Save cart
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItem,
        updateQuantity,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
