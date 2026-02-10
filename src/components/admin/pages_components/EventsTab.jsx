import { useEffect, useState } from "react"
import { db } from "../../../firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export default function EventsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState(null)

  const CLOUDINARY_CLOUD_NAME = "drgjco3qx"
  const CLOUDINARY_UPLOAD_PRESET = "admin_uploads"

  const [form, setForm] = useState({
    media: [{ type: "image", src: "" }],
  })

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "pages", "events"))
      if (snap.exists()) {
        const data = snap.data()
        setForm({ media: Array.isArray(data.media) ? data.media : [] })
      }
      setLoading(false)
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

  const setMedia = (idx, value) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      next.media[idx] = value
      return next
    })
  }

  const addSlot = () => {
    setForm((prev) => ({
      ...prev,
      media: [...prev.media, { type: "image", src: "" }],
    }))
  }

  const removeSlot = (idx) => {
    setForm((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== idx),
    }))
  }

  const handlePickFile = async (e, idx) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingIndex(idx)
    const url = await uploadToCloudinary(file)
    const isVideo = file.type.startsWith("video/")
    setMedia(idx, { type: isVideo ? "video" : "image", src: url })
    setUploadingIndex(null)
  }

  const save = async () => {
    setSaving(true)
    await setDoc(
      doc(db, "pages", "events"),
      {
        media: form.media.filter((m) => m.src),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
    setSaving(false)
    alert("Events updated!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p className="text-sm text-gray-600">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Events Media Gallery</h2>
          <p className="text-sm text-gray-500 mt-1">Upload images and videos for events showcase</p>
        </div>
        <button
          onClick={addSlot}
          className="px-6 py-3 rounded-xl bg-[#7B2220] text-white font-medium hover:bg-[#8B3230] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
          type="button"
        >
          <span>+</span>
          <span>Add Media</span>
        </button>
      </div>

      {form.media.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">📸</div>
          <p className="text-gray-600 font-medium mb-1">No media uploaded yet</p>
          <p className="text-sm text-gray-500">Click &quot;Add Media&quot; to upload images or videos</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {form.media.map((m, idx) => (
            <div
              key={idx}
              className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#7B2220]/30 hover:shadow-lg transition-all duration-200 bg-white"
            >
              <div className="relative bg-gray-100 aspect-video">
                {uploadingIndex === idx ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <div className="animate-spin text-2xl mb-2">⏳</div>
                      <p className="text-sm">Uploading...</p>
                    </div>
                  </div>
                ) : m.src ? (
                  <>
                    {m.type === "video" ? (
                      <video src={m.src} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={m.src} alt={`Event media ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-lg">
                        {m.type === "video" ? "🎥 Video" : "📷 Image"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="text-3xl mb-2">📷</div>
                      <p className="text-sm">No media</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <label className="block">
                  <div className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#7B2220] hover:bg-[#7B2220]/5 transition-all duration-200 text-center">
                    <span className="text-sm text-gray-600">
                      {m.src ? "Replace Media" : "Upload Media"}
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
                  onClick={() => removeSlot(idx)}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 border border-red-200"
                  type="button"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form.media.length > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={save}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-[#7B2220] text-white font-medium hover:bg-[#8B3230] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            type="button"
          >
            {saving ? "💾 Saving..." : "💾 Save Events"}
          </button>
        </div>
      )}
    </div>
  )
}
