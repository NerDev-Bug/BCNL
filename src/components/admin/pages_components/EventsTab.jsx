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

  const emptyEvent = () => ({
    title: "Music Event",
    description:
      "Experience an unforgettable night with Coldplay, featuring their biggest hits and a mesmerizing light show!",
    tag: "Today", // Today | Tomorrow | This weekend
    startAt: "", // datetime-local string
    media: { type: "image", src: "" }, // {type:'image'|'video', src:url}
  })

  const [form, setForm] = useState({
    // ✅ page header settings
    page: {
      title: "Events For You",
      description: "",
    },

    // ✅ editable cards
    events: [emptyEvent()],
  })

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "pages", "events"))
        if (snap.exists()) {
          const data = snap.data()

          // page
          const page = {
            title: data?.page?.title || "Events For You",
            description: data?.page?.description || "",
          }

          // events (new)
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
          }
          // fallback: old schema "media" only
          else if (Array.isArray(data?.media) && data.media.length) {
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
        .filter((e) => e.media?.src) // ✅ only keep events with media

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
      {/* ✅ Page Header Section */}
      <div className="mb-8 p-6 border rounded-xl bg-gray-50">
        <h3 className="text-lg font-bold mb-4 text-gray-900">
          Event Page Header
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">Title</label>
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
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">
              Description
            </label>
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
      </div>

      {/* ✅ Cards Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Cards</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add/edit each card title, description, category, countdown, and media
          </p>
        </div>

        <button
          onClick={addEvent}
          className="px-6 py-3 rounded-xl bg-[#7B2220] text-white font-medium hover:bg-[#8B3230] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
          type="button"
        >
          <Plus size={18} />
          <span>Add Event</span>
        </button>
      </div>

      {form.events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 font-medium mb-1">No events yet</p>
          <p className="text-sm text-gray-500">
            Click &quot;Add Event&quot; to create one
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {form.events.map((ev, idx) => (
            <div
              key={idx}
              className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#7B2220]/30 hover:shadow-lg transition-all duration-200 bg-white"
            >
              {/* preview */}
              <div className="relative bg-gray-100 aspect-video">
                {uploadingIndex === idx ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2 text-white" />
                      <p className="text-sm">Uploading...</p>
                    </div>
                  </div>
                ) : ev.media?.src ? (
                  <>
                    {ev.media.type === "video" ? (
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
                    )}

                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-lg">
                        <span className="flex items-center gap-1">
                          {ev.media.type === "video" ? (
                            <Video size={14} />
                          ) : (
                            <ImageIcon size={14} />
                          )}
                          <span>
                            {ev.media.type === "video" ? "Video" : "Image"}
                          </span>
                        </span>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No media</p>
                    </div>
                  </div>
                )}
              </div>

              {/* fields */}
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Card Title
                    </label>
                    <input
                      value={ev.title}
                      onChange={(e) =>
                        setEventField(idx, "title", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                      placeholder="Music Event"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Description
                    </label>
                    <textarea
                      value={ev.description}
                      onChange={(e) =>
                        setEventField(idx, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white min-h-[90px]"
                      placeholder="Short description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Category
                      </label>
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
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Countdown
                      </label>
                      <input
                        type="datetime-local"
                        value={ev.startAt}
                        onChange={(e) =>
                          setEventField(idx, "startAt", e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* upload */}
                <label className="block">
                  <div className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#7B2220] hover:bg-[#7B2220]/5 transition-all duration-200 text-center">
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

                {/* remove */}
                <button
                  onClick={() => removeEvent(idx)}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 border border-red-200"
                  type="button"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 size={16} />
                    <span>Remove</span>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* save */}
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={save}
          disabled={saving}
          className="px-8 py-3 rounded-xl bg-[#7B2220] text-white font-medium hover:bg-[#8B3230] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          type="button"
        >
          <span className="flex items-center gap-2">
            {saving ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Clock size={16} />
            )}
            <span>{saving ? "Saving..." : "Save Events"}</span>
          </span>
        </button>
      </div>
    </div>
  )
}
