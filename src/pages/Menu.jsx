import { useState } from "react";
import { Heart, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Cart from "../components/Cart";

const products = [
  { id: 1, name: "Chocolate Cake", price: 550, image: "/images/chocolate_cake.jpg" },
  { id: 2, name: "Ube - White Chocolate Cookies", price: 550, image: "/images/ube-white_chocolate_cookies.jpg" },
  { id: 3, name: "Silvanas", price: 550, image: "/images/silvanas.jpg" },
];

export default function Menu() {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const handleAddToCart = (product) => {
    // Check if product is already in cart
    const existing = cartItems.find((item) => item.id === product.id);
    if (existing) {
      // Increase quantity if already exists
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      // Add new item with quantity 1
      setCartItems((prev) => [...prev, { ...product, quantity: 1 }]);
    }

    // Open cart automatically
    setCartOpen(true);
  };

  return (
    <div className="w-full">
      {/* Header Banner */}
      <div className="h-16" />

      <div
        className="h-64 flex items-center justify-center bg-center bg-cover"
        style={{ backgroundImage: "url('/images/menubanner.png')" }}
      >
        <h1 className="text-4xl font-bold text-[#502455] drop-shadow-md">Menu</h1>
      </div>

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-4">
        <div className="flex items-center border rounded-full px-4 py-2 w-full">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="Search products..." className="ml-2 w-full outline-none" />
        </div>

        <select className="border rounded-full px-4 py-2 w-full md:w-56">
          <option>All Categories</option>
          <option>Cakes</option>
          <option>Cookies</option>
          <option>Pastries</option>
        </select>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
        <ChevronLeft className="cursor-pointer" />
        <span>Page 1 of 10</span>
        <ChevronRight className="cursor-pointer" />
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition h-[500px] flex flex-col ring-1 ring-black"
          >
            {/* Image */}
            <div className="flex-1 relative">
              <img src={item.image} alt={item.name} className="w-full h-64 object-cover" />
              <button className="absolute top-4 right-4 bg-white rounded-full p-2 shadow">
                <Heart size={18} className="text-[#7B2220]" />
              </button>
            </div>

            {/* Info */}
            <div className="bg-white p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-cooper text-[#502455] text-xl font-semibold">{item.name}</h3>
                <p className="mt-2 text-gray-700 text-lg">₱{item.price}</p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full px-4 py-2 rounded-md border border-[#7B2220] text-[#7B2220] hover:bg-[#7B2220] hover:text-white transition"
                >
                  Add to Cart
                </button>
                <button className="w-full px-4 py-2 rounded-md bg-[#7B2220] text-white hover:bg-[#502455] transition">
                  Order Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Sidebar */}
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} cartItems={cartItems} />
    </div>
  );
}
