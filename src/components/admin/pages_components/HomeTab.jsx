import { useRef, useState } from "react"

export default function HomeTab({
  form,
  update,
  cloudName,
  uploadPreset,
}) {
  const fileRef = useRef(null)
  const [uploadingCake, setUploadingCake] = useState(false)

  const uploadToCloudinary = async (file) => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", uploadPreset)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: fd }
    )

    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return data.secure_url
  }

  const handleCakePick = () => fileRef.current?.click()

  const handleCakeChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingCake(true)
      const url = await uploadToCloudinary(file)
      update("cakeImage", url)
    } catch (err) {
      console.error(err)
      alert("Cake image upload failed.")
    } finally {
      setUploadingCake(false)
      e.target.value = ""
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          Home Page Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure your homepage hero section
        </p>
      </div>

      <div className="space-y-6">

        {/* =========================
            HERO TEXT
        ========================== */}

        {/* Heading */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Heading
          </label>
          <input
            value={form.heading || ""}
            onChange={(e) => update("heading", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
            placeholder="Homemade cakes and pastries"
          />
        </div>

        {/* Est text */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Est. Text
          </label>
          <input
            value={form.estText || ""}
            onChange={(e) => update("estText", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
            placeholder="est. 2019"
          />
        </div>

        {/* Subheading */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Subheading
          </label>
          <input
            value={form.subheading || ""}
            onChange={(e) => update("subheading", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
            placeholder="Freshly baked cakes and pastries"
          />
        </div>

        {/* =========================
            ✅ NEW: NEXT BAKE DAY
        ========================== */}

        <div className="border-t pt-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">
            Next Bake Day Settings
          </h3>

          {/* Bake Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Next Bake Day
            </label>
            <input
              type="date"
              value={form.nextBakeDate || ""}
              onChange={(e) => update("nextBakeDate", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
            />
          </div>

          {/* Limited Slots Text */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Slots Label
            </label>
            <input
              value={form.nextBakeSlotsText || ""}
              onChange={(e) => update("nextBakeSlotsText", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
              placeholder="limited slots"
            />
          </div>

          {/* Optional Banner Text */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Bake Banner Title
            </label>
            <input
              value={form.nextBakeTitle || ""}
              onChange={(e) => update("nextBakeTitle", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
              placeholder="Next Bake Day"
            />
          </div>
        </div>

        {/* =========================
            IMAGE UPLOAD
        ========================== */}

        <div className="space-y-3 border-t pt-6">
          <label className="block text-sm font-semibold text-gray-700">
            Hero Cake Image
          </label>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={handleCakePick}
              disabled={uploadingCake}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 bg-white"
            >
              {uploadingCake ? "Uploading..." : "📷 Upload Image"}
            </button>

            {form.cakeImage ? (
              <img
                src={form.cakeImage}
                alt="Cake Preview"
                className="h-24 w-24 rounded-xl object-cover border"
              />
            ) : (
              <div className="text-sm text-gray-500">
                No image uploaded yet
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCakeChange}
          />
        </div>
      </div>
    </div>
  )
}
