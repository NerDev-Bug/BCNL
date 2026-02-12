import { useEffect, useMemo, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../../firebase"
import { ChevronLeft, ChevronRight } from "lucide-react"

function PickUp() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // scroll ref
  const scrollRef = useRef(null)

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({
      left: -300,
      behavior: "smooth",
    })
  }

  const scrollRight = () => {
    scrollRef.current?.scrollBy({
      left: 300,
      behavior: "smooth",
    })
  }

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("pickupEnabled", "==", true)
        )
        const snap = await getDocs(q)

        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setItems(data)
      } catch (e) {
        console.error("Failed to load pickup items:", e)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const cards = useMemo(() => {
    return items.map((p) => {
      const leftRaw =
        typeof p.dailyLimit === "number" ? p.dailyLimit : null

      const left =
        leftRaw === null ? null : Math.max(0, Number(leftRaw) || 0)

      const soldOut = p.available === false || left === 0

      return {
        ...p,
        left,
        soldOut,
      }
    })
  }, [items])

  return (
    <section className="w-full py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[#5B1E5D] text-xl">→</span>
          <h2 className="text-lg md:text-xl font-semibold text-[#3b1b3d]">
            Available for <span className="font-bold">Pickup</span>:
          </h2>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2
            [-ms-overflow-style:none] [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-w-[260px] max-w-[260px] snap-start
                bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="h-40 bg-gray-100 animate-pulse" />
                <div className="p-4">
                  <div className="h-4 bg-gray-100 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-gray-600 text-sm bg-white border border-gray-200 rounded-xl p-4">
            No pickup items available right now.
          </div>
        ) : (
          <div className="relative">
            {/* LEFT ICON BUTTON */}
            <button
              onClick={scrollLeft}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10
              w-10 h-10 rounded-full bg-white shadow-md
              flex items-center justify-center
              hover:scale-105 transition"
            >
              <ChevronLeft size={20} />
            </button>

            {/* RIGHT ICON BUTTON */}
            <button
              onClick={scrollRight}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10
              w-10 h-10 rounded-full bg-white shadow-md
              flex items-center justify-center
              hover:scale-105 transition"
            >
              <ChevronRight size={20} />
            </button>

            {/* SCROLL CONTAINER */}
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2
              [-ms-overflow-style:none] [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden"
            >
              {cards.slice(0, 6).map((p) => {
                const badgeText = p.soldOut
                  ? "SOLD OUT"
                  : p.left !== null
                  ? `${p.left} left`
                  : "Available"

                return (
                  <div
                    key={p.id}
                    className="min-w-[260px] max-w-[260px] snap-start
                    bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative">
                      {p.soldOut ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-44 object-cover opacity-70"
                        />
                      ) : (
                        <Link to={`/product/${p.id}`}>
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-44 object-cover"
                          />
                        </Link>
                      )}

                      <div className="absolute top-3 right-3">
                        <span
                          className={[
                            "px-3 py-1 rounded-lg text-xs font-semibold tracking-wide",
                            p.soldOut
                              ? "bg-[#F6E6C9] text-[#4A2B1A]"
                              : "bg-white/95 text-[#2b2b2b] border border-gray-200",
                          ].join(" ")}
                        >
                          {badgeText}
                        </span>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="p-4 text-center">
                      <p className="font-semibold text-[#3b1b3d]">
                        {p.name}
                      </p>

                      {p.left !== null && (
                        <p className="text-sm text-[#3b1b3d]/80">
                          ({p.left} left)
                        </p>
                      )}

                      {!p.soldOut && (
                        <p className="text-xs text-gray-500 mt-2">
                          Tap to view &amp; order
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default PickUp
