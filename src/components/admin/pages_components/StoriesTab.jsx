export default function StoriesTab({ form, update, uploading, handleUpload }) {
  const onPick = async (e, path) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleUpload(file, path)
    e.target.value = ""
  }

  return (
    <>
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
              onChange={(e) => onPick(e, "section1.bgImage")}
              className="w-full"
              disabled={uploading}
            />
            {form.section1.bgImage && (
              <img src={form.section1.bgImage} alt="section1 bg" className="mt-3 w-full rounded-lg border" />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Frame Image (single_frame)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPick(e, "section1.frameImage")}
              className="w-full"
              disabled={uploading}
            />
            {form.section1.frameImage && (
              <img src={form.section1.frameImage} alt="section1 frame" className="mt-3 w-full rounded-lg border" />
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
              onChange={(e) => onPick(e, "section2.bgImage")}
              className="w-full"
              disabled={uploading}
            />
            {form.section2.bgImage && (
              <img src={form.section2.bgImage} alt="section2 bg" className="mt-3 w-full rounded-lg border" />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Frame Image (group_frame)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPick(e, "section2.frameImage")}
              className="w-full"
              disabled={uploading}
            />
            {form.section2.frameImage && (
              <img src={form.section2.frameImage} alt="section2 frame" className="mt-3 w-full rounded-lg border" />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
