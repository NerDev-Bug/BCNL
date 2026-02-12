import TestimonialDropdown from "./TestimonialDropdown"

export default function TestimonialsTab({
  form,
  update,
  allRatings,
  ratingsLoading,
  autoTestimonialsLoading,
  autoTestimonialsPreview,
  computeAutoTopRatedTestimonials,
  setTestimonialAt,
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Customer Testimonials</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select testimonials from customer ratings or use auto-selection
        </p>
      </div>

      {/* Selection Mode */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Selection Mode
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label
            className={`
              relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
              ${
                (form.testimonialsMode || "manual") === "manual"
                  ? "border-[#7B2220] bg-[#7B2220]/5"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }
            `}
          >
            <input
              type="radio"
              name="testimonialsMode"
              checked={(form.testimonialsMode || "manual") === "manual"}
              onChange={() => update("testimonialsMode", "manual")}
              className="w-5 h-5 text-[#7B2220] focus:ring-[#7B2220] focus:ring-2"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Manual Selection</div>
              <div className="text-sm text-gray-500 mt-1">
                Admin manually picks 3 testimonials from customer ratings
              </div>
            </div>
          </label>

          <label
            className={`
              relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
              ${
                form.testimonialsMode === "autoTopRated"
                  ? "border-[#7B2220] bg-[#7B2220]/5"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }
            `}
          >
            <input
              type="radio"
              name="testimonialsMode"
              checked={form.testimonialsMode === "autoTopRated"}
              onChange={() => update("testimonialsMode", "autoTopRated")}
              className="w-5 h-5 text-[#7B2220] focus:ring-[#7B2220] focus:ring-2"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Auto Selection</div>
              <div className="text-sm text-gray-500 mt-1">
                Automatically picks top-rated testimonials with comments
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Auto Mode Section */}
      {form.testimonialsMode === "autoTopRated" && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-100">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Top Rated Testimonials</h3>
              <p className="text-sm text-gray-600">
                Automatically selects the top 3 highest-rated testimonials from customer ratings (includes ratings with or without comments).
              </p>
            </div>

            <button
              type="button"
              onClick={computeAutoTopRatedTestimonials}
              disabled={autoTestimonialsLoading || ratingsLoading || allRatings.length === 0}
              className="px-6 py-3 rounded-xl bg-[#7B2220] text-white font-medium hover:bg-[#8B3230] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              {autoTestimonialsLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Computing...
                </span>
              ) : (
                "🔄 Compute Now"
              )}
            </button>
          </div>

          {autoTestimonialsPreview.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Preview Results:</h4>
              {autoTestimonialsPreview.map((t, idx) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#7B2220] text-white font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < t.rating ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {t.rating}⭐
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-2">
                        {t.comment && t.comment.trim()
                          ? t.comment
                          : `Rated ${t.rating} out of 5 stars`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {t.createdAt?.toLocaleDateString?.() || "Recent"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {autoTestimonialsPreview.length === 0 && !autoTestimonialsLoading && (
            <div className="mt-4 p-4 bg-white/50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 text-center">
                {allRatings.length === 0
                  ? "No ratings found. Customers need to submit ratings first."
                  : 'Click "Compute Now" to generate top-rated testimonials'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Mode Section */}
      {form.testimonialsMode !== "autoTopRated" && (
        <div>
          {ratingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-2">⏳</div>
                <p className="text-sm text-gray-600">Loading ratings...</p>
              </div>
            </div>
          ) : allRatings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-600 font-medium mb-1">No ratings yet</p>
              <p className="text-sm text-gray-500">
                Customers need to submit ratings first
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 mb-4">Select 3 Testimonials</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <TestimonialDropdown
                      label={`Testimonial #${i + 1}`}
                      value={form.testimonialsRatingIds?.[i] || ""}
                      options={allRatings}
                      onChange={(ratingId) => setTestimonialAt(i, ratingId)}
                      disabled={ratingsLoading}
                    />
                    <p className="text-xs text-red-500 mt-1 ml-1">* Required</p>
                  </div>
                ))}
              </div>

              {/* Preview Selected Testimonials */}
              {form.testimonialsRatingIds?.some((id) => id) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Preview Selected Testimonials</h4>
                  <div className="space-y-4">
                    {form.testimonials.map((t, idx) => {
                      if (!t.text) return null
                      return (
                        <div
                          key={idx}
                          className="border-2 border-gray-200 rounded-xl p-4 bg-white"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#7B2220] text-white font-bold text-sm">
                                {idx + 1}
                              </div>
                              <p className="font-semibold text-gray-900">
                                {t.author || "Customer"}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{t.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
