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
    <div className="bg-white rounded-xl p-5 shadow-sm mb-6 space-y-5">
      {/* Heading */}
      <div>
        <label className="block text-sm font-semibold mb-2">Heading</label>
        <input
          value={form.heading || ""}
          onChange={(e) => update("heading", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Homemade cakes and pastries"
        />
      </div>

      {/* Est text */}
      <div>
        <label className="block text-sm font-semibold mb-2">Est. Text</label>
        <input
          value={form.estText || ""}
          onChange={(e) => update("estText", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="est. 2019"
        />
      </div>

      {/* Subheading */}
      <div>
        <label className="block text-sm font-semibold mb-2">Subheading</label>
        <input
          value={form.subheading || ""}
          onChange={(e) => update("subheading", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Home of the first Ube Flan Cake in Wageningen"
        />
      </div>

      {/* Cake Image Upload */}
      <div>
        <label className="block text-sm font-semibold mb-2">Cake Image</label>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleCakePick}
            disabled={uploadingCake}
            className="px-4 py-2 rounded-lg border bg-white"
          >
            {uploadingCake ? "Uploading..." : "Upload Cake Image"}
          </button>

          {form.cakeImage ? (
            <img
              src={form.cakeImage}
              alt="Cake Preview"
              className="h-16 w-16 rounded-lg object-cover border"
            />
          ) : (
            <span className="text-sm text-gray-500">No image uploaded yet</span>
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
  )
}
