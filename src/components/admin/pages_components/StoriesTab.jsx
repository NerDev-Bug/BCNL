const ImageUpload = ({ label, value, onChange, disabled, hint }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
    </div>
    <label className="block">
      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#7B2220] hover:bg-[#7B2220]/5 transition-all duration-200">
        <div className="text-center">
          <div className="text-2xl mb-2">📷</div>
          <span className="text-sm text-gray-600">
            {disabled ? "Uploading..." : "Click to upload"}
          </span>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
        disabled={disabled}
      />
    </label>
    {value && (
      <div className="mt-3 relative group">
        <img
          src={value}
          alt={label}
          className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 shadow-md"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">Preview</span>
        </div>
      </div>
    )}
  </div>
)

const SectionForm = ({ sectionKey, sectionNumber, frameHint, form, update, uploading, onPick }) => (
  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
    <div className="mb-6 pb-4 border-b border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900">Section {sectionNumber}</h2>
      <p className="text-sm text-gray-500 mt-1">Configure content and images for this section</p>
    </div>

    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={form[sectionKey].title || ""}
          onChange={(e) => update(`${sectionKey}.title`, e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
          placeholder="Enter section title"
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Body Content <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form[sectionKey].body || ""}
          onChange={(e) => update(`${sectionKey}.body`, e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all resize-none"
          rows={6}
          placeholder="Enter section content..."
        />
      </div>

      {/* Images */}
      <div className="pt-4 border-t border-gray-200">
        <ImageUpload
          label="Frame Image"
          value={form[sectionKey].frameImage}
          onChange={(e) => onPick(e, `${sectionKey}.frameImage`)}
          disabled={uploading}
          hint={frameHint}
        />
      </div>
    </div>
  </div>
)

export default function StoriesTab({ form, update, uploading, handleUpload }) {
  const onPick = async (e, path) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleUpload(file, path)
    e.target.value = ""
  }

  return (
    <>
      <SectionForm
        sectionKey="section1"
        sectionNumber={1}
        frameHint="Recommended: single_frame image"
        form={form}
        update={update}
        uploading={uploading}
        onPick={onPick}
      />
      <SectionForm
        sectionKey="section2"
        sectionNumber={2}
        frameHint="Recommended: group_frame image"
        form={form}
        update={update}
        uploading={uploading}
        onPick={onPick}
      />
    </>
  )
}
