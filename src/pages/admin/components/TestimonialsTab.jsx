export default function TestimonialsTab({ form, update, addTestimonial, removeTestimonial }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Testimonials</h2>
        <button onClick={addTestimonial} className="px-4 py-2 rounded-lg bg-black text-white" type="button">
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {form.testimonials.map((t, idx) => (
          <div key={idx} className="border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Testimonial #{idx + 1}</p>
              <button onClick={() => removeTestimonial(idx)} className="text-sm text-red-600" type="button">
                Remove
              </button>
            </div>

            <label className="block text-sm font-semibold mb-2">Text</label>
            <textarea
              value={t.text}
              onChange={(e) => update(`testimonials.${idx}.text`, e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              rows={3}
            />

            <label className="block text-sm font-semibold mb-2">Author</label>
            <input
              value={t.author}
              onChange={(e) => update(`testimonials.${idx}.author`, e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="– Name"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
