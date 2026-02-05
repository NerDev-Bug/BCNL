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

  if (loading) return <div>Loading...</div>

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <h2 className="text-lg font-bold mb-4">Events Media</h2>

      {form.media.map((m, idx) => (
        <div key={idx} className="border p-4 rounded-lg mb-4">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handlePickFile(e, idx)}
          />
          {uploadingIndex === idx && <p>Uploading...</p>}

          {m.src && (
            <div className="mt-3 h-[200px] bg-black">
              {m.type === "video" ? (
                <video src={m.src} className="w-full h-full" controls />
              ) : (
                <img src={m.src} className="w-full h-full object-cover" />
              )}
            </div>
          )}

          <button
            onClick={() => removeSlot(idx)}
            className="mt-2 text-red-600"
          >
            Remove
          </button>
        </div>
      ))}

      <button onClick={addSlot} className="bg-black text-white px-4 py-2">
        + Add Media
      </button>

      <button
        onClick={save}
        className="ml-3 bg-[#7B2220] text-white px-6 py-2"
      >
        Save Events
      </button>
    </div>
  )
}
