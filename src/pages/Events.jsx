import { useEffect, useMemo, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { Hourglass, Loader2 } from "lucide-react"
import EventsModal from "../components/modals/EventsModal"

export default function Events() {
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState({
    title: "Events For You",
    description: "",
  })
  const [events, setEvents] = useState([])
  const [active, setActive] = useState("Today")
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    const ref = doc(db, "pages", "events")

    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : null
      if (data?.page) setPage((prev) => ({ ...prev, ...data.page }))

      const list = Array.isArray(data?.events) ? data.events : []
      setEvents(list)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // 🧠 Smart Tag Detection
  const getSmartTag = (startAt) => {
    if (!startAt) return "Today"

    const date = new Date(startAt)
    const today = new Date()

    const isSameDay =
      date.toDateString() === today.toDateString()

    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    const isTomorrow =
      date.toDateString() === tomorrow.toDateString()

    const day = date.getDay()

    if (date.getTime() <= now) return "Past"
    if (isSameDay) return "Today"
    if (isTomorrow) return "Tomorrow"
    if (day === 6 || day === 0) return "This weekend"

    return "Today"
  }

  const processedEvents = useMemo(() => {
    return events.map((e) => ({
      ...e,
      tag: getSmartTag(e.startAt),
    }))
  }, [events, now])

  const filteredEvents = useMemo(() => {
    return processedEvents.filter((e) => e.tag === active)
  }, [processedEvents, active])

const calcLeft = (startAt) => {
  if (!startAt) {
    return { done: false, h: "00", m: "00", s: "00", daysAgo: null }
  }

  const target = new Date(startAt).getTime()
  const diffSeconds = Math.floor((target - now) / 1000)

  const pad = (n) => String(n).padStart(2, "0")

  // 🔥 If event already started
  if (diffSeconds <= 0) {
    const diffDays = Math.floor(Math.abs(diffSeconds) / 86400)

    return {
      done: true,
      h: "00",
      m: "00",
      s: "00",
      daysAgo: diffDays,
    }
  }

  const hours = Math.floor(diffSeconds / 3600)
  const minutes = Math.floor((diffSeconds % 3600) / 60)
  const seconds = diffSeconds % 60

  return {
    done: false,
    h: pad(hours),
    m: pad(minutes),
    s: pad(seconds),
    daysAgo: null,
  }
}
  const Pill = ({ label }) => {
    const isActive = active === label
    return (
      <button
        onClick={() => setActive(label)}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
          isActive
            ? "bg-[#1AA7A1] text-white"
            : "bg-white/70 border border-black/10"
        }`}
      >
        {label}
      </button>
    )
  }

  const Card = ({ e }) => {
    const left = calcLeft(e.startAt)

    return (
      <div
        onClick={() => setSelectedEvent(e)}
        className="cursor-pointer min-w-[320px] max-w-[320px] h-[500px]
                   bg-white rounded-2xl shadow-md overflow-hidden
                   border border-black/10 snap-start flex flex-col"
      >
        <div className="h-44 w-full bg-gray-100 overflow-hidden">
          <img
            src={e.media?.src}
            alt={e.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-extrabold">{e.title}</h3>

          <p className="text-xs text-gray-600 mt-2 line-clamp-3">
            {e.description}
          </p>

          <div className="mt-4 border border-black/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">
                {left.done ? "Status" : "Starting time"}
              </p>
              <Hourglass size={16} />
            </div>

            {left.done ? (
  <div className="mt-3 text-center font-bold text-[#7B2220]">
    {left.daysAgo === 0
      ? "🎉 Event Started"
      : `${left.daysAgo} day${left.daysAgo > 1 ? "s" : ""} ago`}
  </div>
) : (
              <div className="mt-3 grid grid-cols-3 text-center">
                <div>{left.h}</div>
                <div>{left.m}</div>
                <div>{left.s}</div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 text-xs text-gray-500 font-semibold">
            Click to view details
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#CBEA5B] px-4 pt-28 pb-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-center text-3xl md:text-4xl font-extrabold">
          {page?.title}
        </h1>

        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          <Pill label="Today" />
          <Pill label="Tomorrow" />
          <Pill label="This weekend" />
          <Pill label="Past" />
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center text-sm text-gray-600">
              No events available.
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory justify-center pb-2">
              {filteredEvents.map((e, i) => (
                <Card key={i} e={e} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <EventsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}