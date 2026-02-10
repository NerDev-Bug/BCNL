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
      update("cakeImage", url) // ✅ save to form
    } catch (err) {
      console.error(err)
      alert("Cake image upload failed. Please try again.")
    } finally {
      setUploadingCake(false)
      e.target.value = "" // reset
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Home Page Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your homepage hero section</p>
      </div>

      <div className="space-y-6">
        {/* Heading */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Heading <span className="text-red-500">*</span>
          </label>
          <input
            value={form.heading || ""}
            onChange={(e) => update("heading", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
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
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
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
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
            placeholder="Home of the first Ube Flan Cake in Wageningen"
          />
        </div>

        {/* Cake Image Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Hero Cake Image
          </label>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={handleCakePick}
              disabled={uploadingCake}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-medium hover:border-[#7B2220] hover:text-[#7B2220] hover:bg-[#7B2220]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {uploadingCake ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Uploading...
                </span>
              ) : (
                "📷 Upload Image"
              )}
            </button>

            {form.cakeImage ? (
              <div className="relative group">
                <img
                  src={form.cakeImage}
                  alt="Cake Preview"
                  className="h-24 w-24 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium">Preview</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                <span>📷</span>
                <span>No image uploaded yet</span>
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
