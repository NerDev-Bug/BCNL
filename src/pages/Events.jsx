import { useEffect, useMemo, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { Hourglass, Loader2 } from "lucide-react"

export default function Events() {
  const [loading, setLoading] = useState(true)

  // ✅ page header settings
  const [page, setPage] = useState({
    title: "Events For You",
    description: "",
  })

  // ✅ each card is an event object (editable in admin)
  const [events, setEvents] = useState([])

  // pills (now can filter)
  const [active, setActive] = useState("Today") // Today | Tomorrow | This weekend

  // live data
  useEffect(() => {
    const ref = doc(db, "pages", "events")

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : null

        // page header
        if (data?.page) setPage((prev) => ({ ...prev, ...data.page }))

        // events list
        const list = Array.isArray(data?.events) ? data.events : []

        // normalize + keep only those with media src
        const normalized = list
          .map((e) => ({
            title: e?.title || "Event",
            description: e?.description || "",
            tag: e?.tag || "Today",
            startAt: e?.startAt || "", // datetime-local string
            media: e?.media?.src
              ? e.media
              : e?.src
              ? { type: e?.type || "image", src: e.src }
              : { type: "image", src: "" },
          }))
          .filter((e) => e.media?.src)

        setEvents(normalized)
        setLoading(false)
      },
      (err) => {
        console.error("Events snapshot error:", err)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [])

  // tick once per second for countdowns
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const Pill = ({ label }) => {
    const isActive = active === label
    return (
      <button
        type="button"
        onClick={() => setActive(label)}
        className={[
          "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
          isActive
            ? "bg-[#1AA7A1] text-white shadow-sm"
            : "bg-white/70 text-[#2b2b2b] border border-black/10 hover:bg-white",
        ].join(" ")}
      >
        {label}
      </button>
    )
  }

  const calcLeft = (startAt) => {
    const pad = (n) => String(n).padStart(2, "0")

    if (!startAt) return { h: "00", m: "00", s: "00", valid: false }

    const target = new Date(startAt).getTime()
    if (Number.isNaN(target)) return { h: "00", m: "00", s: "00", valid: false }

    const diff = Math.max(0, Math.floor((target - now) / 1000))
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60

    return { h: pad(hours), m: pad(minutes), s: pad(seconds), valid: true }
  }

  const filteredEvents = useMemo(() => {
    return events.filter((e) => e.tag === active)
  }, [events, active])

  const Card = ({ e, i }) => {
    const left = calcLeft(e.startAt)

    return (
      <div className="min-w-[320px] max-w-[320px] snap-start bg-white rounded-2xl shadow-md overflow-hidden border border-black/10">
        {/* media */}
        <div className="h-44 w-full bg-gray-100 overflow-hidden">
          {e.media.type === "video" ? (
            <video
              src={e.media.src}
              className="h-full w-full object-cover"
              controls
            />
          ) : (
            <img
              src={e.media.src}
              alt={e.title || `Event ${i + 1}`}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* text */}
        <div className="p-5">
          <h3 className="text-lg font-extrabold text-[#1d1d1d]">{e.title}</h3>

          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            {e.description}
          </p>

          {/* countdown */}
          <div className="mt-4 border border-black/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">
                Remaining times
              </p>
              <Hourglass size={18} />
            </div>

            <div className="mt-3 grid grid-cols-3 text-center">
              <div>
                <div className="text-lg font-extrabold text-[#1d1d1d]">
                  {left.h}
                </div>
                <div className="text-[10px] text-gray-500 font-semibold">
                  Hours
                </div>
              </div>

              <div className="border-x border-black/10">
                <div className="text-lg font-extrabold text-[#1d1d1d]">
                  {left.m}
                </div>
                <div className="text-[10px] text-gray-500 font-semibold">
                  Minutes
                </div>
              </div>

              <div>
                <div className="text-lg font-extrabold text-[#1d1d1d]">
                  {left.s}
                </div>
                <div className="text-[10px] text-gray-500 font-semibold">
                  Seconds
                </div>
              </div>
            </div>

            {!left.valid && (
              <p className="text-[10px] text-gray-500 mt-3 text-center">
                Admin hasn’t set a countdown date yet.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#CBEA5B] px-4 pt-28 pb-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-center text-3xl md:text-4xl font-extrabold text-[#1d1d1d]">
          {page?.title || "Events For You"}
        </h1>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Pill label="Today" />
          <Pill label="Tomorrow" />
          <Pill label="This weekend" />
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="flex gap-6 justify-center">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full max-w-[320px] h-[340px] bg-white/70 rounded-2xl border border-black/10 flex items-center justify-center"
                >
                  <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 border border-black/10 text-center">
              <p className="text-sm text-gray-600">
                No events available right now.
              </p>
            </div>
          ) : (
            <div
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth
                         justify-center pb-2
                         [-ms-overflow-style:none] [scrollbar-width:none]
                         [&::-webkit-scrollbar]:hidden"
            >
              {filteredEvents.map((e, i) => (
                <Card key={`${e.media.src}-${i}`} e={e} i={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
