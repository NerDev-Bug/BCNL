export default function TestimonialsTab({ form, update, addTestimonial, removeTestimonial }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Testimonials</h2>
          <p className="text-sm text-gray-500 mt-1">Manage customer reviews and testimonials</p>
        </div>
        <button
          onClick={addTestimonial}
          className="px-6 py-3 rounded-xl bg-[#7B2220] text-white font-medium hover:bg-[#8B3230] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
          type="button"
        >
          <span>+</span>
          <span>Add Testimonial</span>
        </button>
      </div>

      {form.testimonials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-600 font-medium mb-1">No testimonials yet</p>
          <p className="text-sm text-gray-500">Click &quot;Add Testimonial&quot; to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {form.testimonials.map((t, idx) => (
            <div
              key={idx}
              className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#7B2220]/30 hover:shadow-md transition-all duration-200 bg-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#7B2220] text-white font-bold">
                    {idx + 1}
                  </div>
                  <p className="font-semibold text-gray-900">Testimonial #{idx + 1}</p>
                </div>
                <button
                  onClick={() => removeTestimonial(idx)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                  type="button"
                >
                  🗑️ Remove
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Testimonial Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={t.text || ""}
                    onChange={(e) => update(`testimonials.${idx}.text`, e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all resize-none"
                    rows={4}
                    placeholder="Enter customer testimonial..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Author Name
                  </label>
                  <input
                    value={t.author || ""}
                    onChange={(e) => update(`testimonials.${idx}.author`, e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-[#7B2220] focus:ring-2 focus:ring-[#7B2220]/20 outline-none transition-all"
                    placeholder="Customer name (optional)"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
