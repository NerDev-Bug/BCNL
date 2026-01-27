import { useEffect, useState } from "react"
import { db } from "../../firebase" // adjust path
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export default function Pages() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // ✅ Put your Cloudinary details here
  const CLOUDINARY_CLOUD_NAME = "drgjco3qx"
  const CLOUDINARY_UPLOAD_PRESET = "admin_uploads"

  const [form, setForm] = useState({
    heading: "Our Story",
    section1: {
      title: "",
      body: "",
      ctaText: "Contact Us",
      bgImage: "",
      frameImage: "",
    },
    section2: {
      title: "",
      body: "",
      ctaText: "Contact Us",
      bgImage: "",
      frameImage: "",
    },
    testimonials: [
      { text: "", author: "" },
      { text: "", author: "" },
      { text: "", author: "" },
    ],
  })

  // Load existing content
  useEffect(() => {
    const load = async () => {
      try {
        const refDoc = doc(db, "pages", "ourStory")
        const snap = await getDoc(refDoc)

        if (snap.exists()) {
          const data = snap.data()
          setForm((prev) => ({
            ...prev,
            ...data,
            section1: { ...prev.section1, ...(data.section1 || {}) },
            section2: { ...prev.section2, ...(data.section2 || {}) },
            testimonials: Array.isArray(data.testimonials)
              ? data.testimonials
              : prev.testimonials,
          }))
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // Safe nested update
  const update = (path, value) => {
    setForm((prev) => {
      const copy = structuredClone(prev)
      const keys = path.split(".")
      let cur = copy
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
      cur[keys[keys.length - 1]] = value
      return copy
    })
  }

  // ✅ Upload file to Cloudinary and return URL
  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

    const res = await fetch(url, {
      method: "POST",
      body: fd,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(err)
    }

    const data = await res.json()
    return data.secure_url // ✅ final image URL
  }

  // Handle file input -> upload -> store URL into form
  const handleUpload = async (e, fieldPath) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const imageUrl = await uploadToCloudinary(file)
      update(fieldPath, imageUrl)
    } catch (err) {
      console.error("Cloudinary upload failed:", err)
      alert("Upload failed. Check console.")
    } finally {
      setUploading(false)
      e.target.value = "" // reset input so same file can be re-uploaded if needed
    }
  }

  const addTestimonial = () => {
    setForm((prev) => ({
      ...prev,
      testimonials: [...(prev.testimonials || []), { text: "", author: "" }],
    }))
  }

  const removeTestimonial = (idx) => {
    setForm((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== idx),
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const refDoc = doc(db, "pages", "ourStory")
      await setDoc(
        refDoc,
        {
          ...form,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      alert("Our Story updated!")
    } catch (err) {
      console.error("Save failed:", err)
      alert("Save failed. Check console.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Pages • Our Story</h1>
      {uploading && (
        <p className="text-sm text-gray-600 mb-4">Uploading image...</p>
      )}

      {/* Heading */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <label className="block text-sm font-semibold mb-2">Heading</label>
        <input
          value={form.heading}
          onChange={(e) => update("heading", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Our Story"
        />
      </div>

      {/* Section 1 */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-4">Section 1</h2>

        <label className="block text-sm font-semibold mb-2">Title</label>
        <input
          value={form.section1.title}
          onChange={(e) => update("section1.title", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <label className="block text-sm font-semibold mb-2">Body</label>
        <textarea
          value={form.section1.body}
          onChange={(e) => update("section1.body", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          rows={5}
        />

        <label className="block text-sm font-semibold mb-2">Button Text</label>
        <input
          value={form.section1.ctaText}
          onChange={(e) => update("section1.ctaText", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Background Image (redpaint)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, "section1.bgImage")}
              className="w-full"
              disabled={uploading}
            />
            {form.section1.bgImage && (
              <img
                src={form.section1.bgImage}
                alt="section1 bg"
                className="mt-3 w-full rounded-lg border"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Frame Image (single_frame)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, "section1.frameImage")}
              className="w-full"
              disabled={uploading}
            />
            {form.section1.frameImage && (
              <img
                src={form.section1.frameImage}
                alt="section1 frame"
                className="mt-3 w-full rounded-lg border"
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-4">Section 2</h2>

        <label className="block text-sm font-semibold mb-2">Title</label>
        <input
          value={form.section2.title}
          onChange={(e) => update("section2.title", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <label className="block text-sm font-semibold mb-2">Body</label>
        <textarea
          value={form.section2.body}
          onChange={(e) => update("section2.body", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          rows={5}
        />

        <label className="block text-sm font-semibold mb-2">Button Text</label>
        <input
          value={form.section2.ctaText}
          onChange={(e) => update("section2.ctaText", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Background Image (bg_purple)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, "section2.bgImage")}
              className="w-full"
              disabled={uploading}
            />
            {form.section2.bgImage && (
              <img
                src={form.section2.bgImage}
                alt="section2 bg"
                className="mt-3 w-full rounded-lg border"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Frame Image (group_frame)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, "section2.frameImage")}
              className="w-full"
              disabled={uploading}
            />
            {form.section2.frameImage && (
              <img
                src={form.section2.frameImage}
                alt="section2 frame"
                className="mt-3 w-full rounded-lg border"
              />
            )}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Testimonials</h2>
          <button
            onClick={addTestimonial}
            className="px-4 py-2 rounded-lg bg-black text-white"
            type="button"
          >
            + Add
          </button>
        </div>

        <div className="space-y-4">
          {form.testimonials.map((t, idx) => (
            <div key={idx} className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Testimonial #{idx + 1}</p>
                <button
                  onClick={() => removeTestimonial(idx)}
                  className="text-sm text-red-600"
                  type="button"
                >
                  Remove
                </button>
              </div>

              <label className="block text-sm font-semibold mb-2">Text</label>
              <textarea
                value={t.text}
                onChange={(e) =>
                  update(`testimonials.${idx}.text`, e.target.value)
                }
                className="w-full border rounded-lg px-3 py-2 mb-4"
                rows={3}
              />

              <label className="block text-sm font-semibold mb-2">Author</label>
              <input
                value={t.author}
                onChange={(e) =>
                  update(`testimonials.${idx}.author`, e.target.value)
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="– Name"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving || uploading}
        className="bg-[#7B2220] text-white px-6 py-3 rounded-xl disabled:opacity-60"
        type="button"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  )
}
