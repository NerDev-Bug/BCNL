import { useParams, Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { db } from "../firebase"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore"
import { Search } from "lucide-react"

export default function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [search, setSearch] = useState("")
  const navigate = useNavigate()

const handleSearchSubmit = (e) => {
  e.preventDefault()
  if (!search.trim()) return
  navigate(`/menu?search=${encodeURIComponent(search.trim())}`)
}

const filteredRelated = relatedProducts.filter((p) =>
  (p.name || "").toLowerCase().includes(search.toLowerCase())
)

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      const docRef = doc(db, "products", id)
      const snap = await getDoc(docRef)
      if (!snap.exists()) return

      const current = { id: snap.id, ...snap.data() }
      setProduct(current)

      if (!current.category) {
        setRelatedProducts([])
        return
      }

      const q = query(
        collection(db, "products"),
        where("category", "==", current.category),
        limit(10)
      )

      const relSnap = await getDocs(q)

      const sameCategory = relSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.id !== current.id)
        .slice(0, 3)

      setRelatedProducts(sameCategory)
    }

    fetchProductAndRelated()
  }, [id])

  if (!product) {
    return <div className="text-center py-20">Loading...</div>
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center"
      style={{ backgroundImage: `url('/images/gingham_pattern_purple_bg.jpg')` }}
    >
      <div className="max-w-6xl mx-auto px-3 pt-16 w-full">
        {/* TOP BAR (breadcrumb + search) */}
<div className="bg-white border-2 border-black rounded-sm px-4 py-3 flex items-center gap-3 w-full">
  {/* CLICKABLE BREADCRUMB */}
  <p className="text-sm text-gray-700 flex-1 truncate">
    <Link to="/menu" className="hover:underline hover:text-black">
      Menu
    </Link>

    <span className="mx-1">{">"}</span>

    <Link
      to={`/menu?category=${encodeURIComponent(product.category || "")}`}
      className="hover:underline hover:text-black"
    >
      {product.category || "category"}
    </Link>

    <span className="mx-1">{">"}</span>

    <span className="font-medium text-black">{product.name}</span>
  </p>

  {/* FUNCTIONAL SEARCH */}
  <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
    <Search
      size={18}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
    />
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search related..."
      className="w-full border border-black rounded-sm pl-10 pr-3 py-2 outline-none"
    />
  </form>
</div>

        {/* MAIN CARD */}
        <div className="mt-3 bg-white border-[3px] border-[#2AA8FF] p-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* LEFT IMAGE */}
            <div className="flex justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] rounded-xl border border-gray-300 object-cover"
              />
            </div>

            {/* RIGHT INFO */}
            <div className="text-center md:text-left text-[#7B2220]">
              {/* TITLE */}
              <h1 className="text-4xl font-extrabold text-center md:text-left">
                {product.name}
              </h1>

              {/* DESCRIPTION */}
              <p className="text-sm text-center md:text-left mt-4 leading-relaxed max-w-md md:mx-0 mx-auto">
                {product.description || "No description available."}
              </p>

              {/* PRICE (under description, right side) */}
              <p className="text-sm font-bold text-right mt-2 max-w-md md:ml-0 mx-auto">
                ₱{product.price}
              </p>

              {/* BUTTONS */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button className="w-44 border border-[#7B2220] text-[#7B2220] px-6 py-2 rounded-md hover:bg-[#7B2220]/5">
                  Add to wishlist
                </button>
                <button className="w-44 bg-[#7B2220] text-white px-6 py-2 rounded-md hover:opacity-95">
                  Order Now
                </button>
              </div>

              {/* RELATED */}
              <div className="mt-8">
                <p className="text-sm text-[#7B2220] text-center md:text-left mb-3">
                  Related Products
                </p>

                <div className="flex items-center justify-center md:justify-start gap-6">
                  {filteredRelated.length ? (
  filteredRelated.map((p) => (

                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-lg border border-gray-400 overflow-hidden bg-white cursor-pointer hover:scale-105 hover:border-[#7B2220] transition-all"
                        title={p.name}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">
                      No related products found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  )
}
