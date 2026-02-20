// EventsTab.jsx (ADMIN) - FULL (Editable cards + page header)
// Saves to Firestore: pages/events { page: {...}, events: [...] }

import { useEffect, useState } from "react"
import { db } from "../../../firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import {
  Loader2,
  ImageIcon,
  Video,
  Trash2,
  Plus,
  Clock,
} from "lucide-react"

export default function EventsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState(null)

  const CLOUDINARY_CLOUD_NAME = "drgjco3qx"
  const CLOUDINARY_UPLOAD_PRESET = "admin_uploads"

  // ✅ generate time options every 30 minutes
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = String(Math.floor(i / 2)).padStart(2, "0")
    const minutes = i % 2 === 0 ? "00" : "30"
    const value = `${hours}:${minutes}`

    const h12 = ((+hours + 11) % 12) + 1
    const ampm = +hours >= 12 ? "PM" : "AM"
    const label = `${h12}:${minutes} ${ampm}`

    return { value, label }
  })

  const emptyEvent = () => ({
    title: "Music Event",
    description:
      "Experience an unforgettable night with Coldplay, featuring their biggest hits and a mesmerizing light show!",
    tag: "Today",
    startAt: "",
    media: { type: "image", src: "" },
  })

  const [form, setForm] = useState({
    page: {
      title: "Events For You",
      description: "",
    },
    events: [emptyEvent()],
  })

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "pages", "events"))
        if (snap.exists()) {
          const data = snap.data()

          const page = {
            title: data?.page?.title || "Events For You",
            description: data?.page?.description || "",
          }

          if (Array.isArray(data?.events) && data.events.length) {
            setForm({
              page,
              events: data.events.map((e) => ({
                ...emptyEvent(),
                ...e,
                media: e?.media?.src
                  ? e.media
                  : e?.src
                  ? { type: e?.type || "image", src: e.src }
                  : { type: "image", src: "" },
              })),
            })
          } else if (Array.isArray(data?.media) && data.media.length) {
            setForm({
              page,
              events: data.media.map((m) => ({
                ...emptyEvent(),
                media: { type: m?.type || "image", src: m?.src || "" },
              })),
            })
          } else {
            setForm({ page, events: [emptyEvent()] })
          }
        }
      } catch (e) {
        console.error("Failed to load events doc:", e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
    const res = await fetch(url, { method: "POST", body: fd })
    const data = await res.json()
    return data.secure_url
  }

  const setEventField = (idx, key, value) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      next.events[idx][key] = value
      return next
    })
  }

  const setEventMedia = (idx, value) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      next.events[idx].media = value
      return next
    })
  }

  const addEvent = () => {
    setForm((prev) => ({
      ...prev,
      events: [...prev.events, emptyEvent()],
    }))
  }

  const removeEvent = (idx) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== idx),
    }))
  }

  const handlePickFile = async (e, idx) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingIndex(idx)
      const url = await uploadToCloudinary(file)
      const isVideo = file.type.startsWith("video/")
      setEventMedia(idx, { type: isVideo ? "video" : "image", src: url })
    } catch (err) {
      console.error("Upload failed:", err)
      alert("Upload failed. Please try again.")
    } finally {
      setUploadingIndex(null)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const clean = form.events
        .map((e) => ({
          title: (e.title || "").trim(),
          description: (e.description || "").trim(),
          tag: e.tag || "Today",
          startAt: e.startAt || "",
          media: e.media?.src ? e.media : { type: "image", src: "" },
        }))
        .filter((e) => e.media?.src)

      await setDoc(
        doc(db, "pages", "events"),
        {
          page: {
            title: (form.page.title || "").trim(),
            description: (form.page.description || "").trim(),
          },
          events: clean,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      alert("Events updated!")
    } catch (e) {
      console.error("Save failed:", e)
      alert("Save failed. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-600">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
      {/* Page Header */}
      <div className="mb-8 p-6 border rounded-xl bg-gray-50">
        <h3 className="text-lg font-bold mb-4 text-gray-900">
          Event Page Header
        </h3>

        <div className="space-y-4">
          <input
            value={form.page.title}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                page: { ...prev.page, title: e.target.value },
              }))
            }
            placeholder="Page Title"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
          />

          <textarea
            value={form.page.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                page: { ...prev.page, description: e.target.value },
              }))
            }
            placeholder="Short description under the title (optional)"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white min-h-[100px]"
          />
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {form.events.map((ev, idx) => (
          <div
            key={idx}
            className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white"
          >
            {/* preview */}
            <div className="relative bg-gray-100 aspect-video">
              {uploadingIndex === idx ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  <Loader2 className="animate-spin w-6 h-6" />
                </div>
              ) : ev.media?.src ? (
                ev.media.type === "video" ? (
                  <video
                    src={ev.media.src}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={ev.media.src}
                    alt={`Event ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* fields */}
            <div className="p-4 space-y-3">
              <input
                value={ev.title}
                onChange={(e) =>
                  setEventField(idx, "title", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                placeholder="Music Event"
              />

              <textarea
                value={ev.description}
                onChange={(e) =>
                  setEventField(idx, "description", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white min-h-[90px]"
              />

              {/* category + date + time */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={ev.tag}
                  onChange={(e) =>
                    setEventField(idx, "tag", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>This weekend</option>
                </select>

                {/* DATE */}
                <input
                  type="date"
                  value={ev.startAt?.split("T")[0] || ""}
                  onChange={(e) => {
                    const time = ev.startAt?.split("T")[1] || "00:00"
                    setEventField(idx, "startAt", `${e.target.value}T${time}`)
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              {/* TIME DROPDOWN */}
              <select
                value={ev.startAt?.split("T")[1] || "00:00"}
                onChange={(e) => {
                  const date = ev.startAt?.split("T")[0] || ""
                  setEventField(idx, "startAt", `${date}T${e.target.value}`)
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {timeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* upload */}
              <label className="block">
                <div className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-center">
                  <span className="text-sm text-gray-600">
                    {ev.media?.src ? "Replace Media" : "Upload Media"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handlePickFile(e, idx)}
                  className="hidden"
                  disabled={uploadingIndex === idx}
                />
              </label>

              <button
                onClick={() => removeEvent(idx)}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200"
                type="button"
              >
                <span className="flex items-center justify-center gap-2">
                  <Trash2 size={16} />
                  Remove
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={addEvent}
          className="px-6 py-3 rounded-xl bg-gray-200 font-medium flex items-center gap-2"
          type="button"
        >
          <Plus size={18} />
          Add Event
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="px-8 py-3 rounded-xl bg-[#7B2220] text-white font-medium flex items-center gap-2"
          type="button"
        >
          {saving ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <Clock size={16} />
          )}
          {saving ? "Saving..." : "Save Events"}
        </button>
      </div>
    </div>
  )
}
