import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Wishlist() {
  const [wishlist, setWishlist] = useState([])

  // Load wishlist from localStorage
  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist')) || []
    setWishlist(savedWishlist)
  }, [])

  return (
    <div
      className="pt-32 min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/wishlist-bg.png')",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 flex justify-center">

        {/* EMPTY STATE */}
        {wishlist.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 text-center shadow-lg w-full md:w-2/3">
            <img
              src="./images/favorite-empty.png"
              alt="Empty wishlist"
              className="w-20 h-20 mx-auto opacity-60"
            />

            <p className="mt-8 text-2xl font-semibold text-[#7B2220]">
              Wishlist is empty
            </p>

            <p className="mt-4 text-base text-gray-500">
              You don't have any products in the wishlist yet.
              <br />
              You will find a lot of interesting products on our{" "}
              <Link
                to="/menu"
                className="text-[#7B2220] underline font-medium"
              >
                Menu
              </Link>
              .
            </p>
          </div>
        ) : (
          /* ITEMS GRID */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded"
                />

                <h3 className="mt-3 font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">₱{item.price}</p>

                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="mt-3 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  function removeFromWishlist(id) {
    const updated = wishlist.filter(item => item.id !== id)
    setWishlist(updated)
    localStorage.setItem('wishlist', JSON.stringify(updated))
  }
}

export default Wishlist
