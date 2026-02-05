export default function HomeTab({ form, update }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
      <label className="block text-sm font-semibold mb-2">Heading</label>
      <input
        value={form.heading}
        onChange={(e) => update("heading", e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Our Story"
      />
    </div>
  )
}
