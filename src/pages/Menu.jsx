import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Search } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useCart } from "../context/CartContext";

  export default function Menu() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All Categories");
    const { addToCart } = useCart();

    const flyToCart = (img) => {
    const cartIcon = document.querySelector("#cart-icon")
    if (!img || !cartIcon) return

    const imgRect = img.getBoundingClientRect()
    const cartRect = cartIcon.getBoundingClientRect()

    const clone = img.cloneNode(true)
    clone.style.position = "fixed"
    clone.style.left = imgRect.left + "px"
    clone.style.top = imgRect.top + "px"
    clone.style.width = imgRect.width + "px"
    clone.style.height = imgRect.height + "px"
    clone.style.transition = "all 0.8s ease-in-out"
    clone.style.zIndex = 9999

    document.body.appendChild(clone)

    requestAnimationFrame(() => {
      clone.style.left = cartRect.left + "px"
      clone.style.top = cartRect.top + "px"
      clone.style.width = "20px"
      clone.style.height = "20px"
      clone.style.opacity = "0"
    })

    setTimeout(() => clone.remove(), 800)
  }

  // 🔹 FETCH PRODUCTS
  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    };
    fetchProducts();
  }, []);

  return (
    <div className="w-full">

      {/* 🔹 MENU HEADER BANNER */}
      <div
        className="w-full border-y-2 border-black min-h-[250px] flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/menubanner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-[#502455] font-cooper text-center translate-y-8">
          Menu
        </h1>
      </div>

      {/* 🔹 PAGE CONTENT */}
      <div
        className="bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url('/images/gingham_pattern_purple_bg.jpg')` }}
      >
        <div className="py-8 px-4 max-w-6xl mx-auto">

          {/* 🔹 SEARCH + CATEGORY BAR */}
          <div  className="border border-[#7B2220] rounded-md p-2 bg-[#502455] sticky z-20"
            style={{ top: '100px' }} // custom spacing from top
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
                />
              </div>

              <div className="w-full md:w-56">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
                >
                  <option>All Categories</option>
                  <option>Cakes</option>
                  <option>Cookies</option>
                  <option>Pastries</option>
                  <option>Drinks</option>
                </select>
              </div>
            </div>
          </div>

          {/* 🔹 PRODUCTS GRID */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {products
              .filter((product) =>
                product.name.toLowerCase().includes(search.toLowerCase())
              )
              .filter((product) =>
                category === "All Categories"
                  ? true
                  : product.category === category
              )
              .map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-white border border-[#7B2220] rounded-md shadow-md overflow-hidden flex flex-col"
                >
                  <div className="p-4">
                    <div className="relative border border-gray-200 rounded-md overflow-hidden">
                      <Link to={`/product/${product.id}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`w-full h-80 object-cover transition-transform hover:scale-105 ${
                            !product.available ? "opacity-60" : ""
                          }`}
                        />
                      </Link>

                      {!product.available && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            Not Available
                          </span>
                        </div>
                      )}

                      <button className="absolute top-3 right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100">
                        ❤️
                      </button>
                    </div>
                  </div>

                  <div className="px-6 pb-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-center text-lg font-semibold text-[#7B2220]">
                        {product.name}
                      </h3>
                      <p className="text-center text-sm font-semibold text-[#7B2220] mt-2">
                        ₱{product.price}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-4">
                      <button
                        disabled={!product.available}
                        className={`flex-1 border border-[#7B2220] rounded-md py-2 text-sm ${
                          product.available
                            ? "hover:bg-[#7B2220] hover:text-white"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Add to Wishlist
                      </button>

                      <button
                        onClick={(e) => {
                          const img = e.currentTarget
                            .closest(".group")
                            .querySelector("img");

                          const success = addToCart(product);

                          if (!success) {
                            window.openLoginModal?.();
                            return; // ❌ NO flyToCart
                          }

                          flyToCart(img); // ✅ only when logged in
                        }}
                        disabled={!product.available}
                        className={`flex-1 rounded-md py-2 font-bold ${
                          product.available
                            ? "bg-[#7B2220] text-white hover:bg-[#502455]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 