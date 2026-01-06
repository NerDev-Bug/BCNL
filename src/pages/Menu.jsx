import { Heart, Search, ChevronLeft, ChevronRight } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Chocolate Cake",
    price: 550,
    image:
      "/images/chocolate_cake.jpg",
  },
  {
    id: 2,
    name: "Ube - White Chocolate Cookies",
    price: 550,
    image:
      "/images/ube-white_chocolate_cookies.jpg",
  },
  {
    id: 3,
    name: "Silvanas",
    price: 550,
    image:
      "/images/silvanas.jpg",
  },
];

export default function Menu() {
  return (
    <div className="w-full">
      {/* Header Banner */}
<div className="h-16" />

<div
  className="h-64 flex items-center justify-center bg-center bg-cover"
  style={{ backgroundImage: "url('/images/menubanner.png')" }}
>
  <h1 className="text-4xl font-bold text-[#502455] drop-shadow-md">
    Menu
  </h1>
</div>


      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-4">
        <div className="flex items-center border rounded-full px-4 py-2 w-full">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="ml-2 w-full outline-none"
          />
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
            className="border rounded-xl p-4 relative hover:shadow-lg transition h-[500px]"
          >
            {/* Wishlist */}
            <button className="absolute top-4 right-4 bg-white rounded-full p-2 shadow">
              <Heart size={18} className="text-gray-500" />
            </button>

            {/* Image */}
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-64 object-cover rounded-lg"
            />

            {/* Info */}
            <div className="text-center mt-4">
              <h3 className="font-semibold text-lg text-[#7a1f2b]">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                ₱{item.price}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-4 gap-3">
              <button className="w-full border border-[#7a1f2b] text-[#7a1f2b] rounded-full py-2 text-sm hover:bg-[#7a1f2b] hover:text-white transition">
                Add to Wishlist
              </button>
              <button className="w-full border border-[#7a1f2b] text-[#7a1f2b] rounded-full py-2 text-sm hover:bg-[#7a1f2b] hover:text-white transition">
                Order Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
