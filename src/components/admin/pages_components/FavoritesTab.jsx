import ProductDropdown from "./ProductDropdown"

export default function FavoritesTab({
  form,
  update,
  allProducts,
  productsLoading,
  autoFavoritesLoading,
  autoFavoritesPreview,
  computeWeeklyMostBoughtTop3,
  setFavoriteAt,
}) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-6">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Favorites Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">Choose how favorites are selected and displayed</p>
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
                (form.favoritesMode || "manual") === "manual"
                  ? "border-[#7B2220] bg-[#7B2220]/5"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }
            `}
          >
            <input
              type="radio"
              name="favMode"
              checked={(form.favoritesMode || "manual") === "manual"}
              onChange={() => update("favoritesMode", "manual")}
              className="w-5 h-5 text-[#7B2220] focus:ring-[#7B2220] focus:ring-2"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Manual Selection</div>
              <div className="text-sm text-gray-500 mt-1">Admin manually picks 3 favorite products</div>
            </div>
          </label>

          <label
            className={`
              relative flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
              ${
                form.favoritesMode === "weeklyMostBought"
                  ? "border-[#7B2220] bg-[#7B2220]/5"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }
            `}
          >
            <input
              type="radio"
              name="favMode"
              checked={form.favoritesMode === "weeklyMostBought"}
              onChange={() => update("favoritesMode", "weeklyMostBought")}
              className="w-5 h-5 text-[#7B2220] focus:ring-[#7B2220] focus:ring-2"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Auto Selection</div>
              <div className="text-sm text-gray-500 mt-1">Automatically picks weekly most bought products</div>
            </div>
          </label>
        </div>
      </div>

      {/* Auto Mode Section */}
      {form.favoritesMode === "weeklyMostBought" && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Weekly Most Bought</h3>
              <p className="text-sm text-gray-600">
                Automatically selects the top 3 products based on this week&apos;s order quantities (Monday to Sunday).
              </p>
            </div>

            <button
              type="button"
              onClick={computeWeeklyMostBoughtTop3}
              disabled={autoFavoritesLoading || productsLoading}
              className="px-6 py-3 rounded-xl bg-[#7B2220] text-white font-medium hover:bg-[#8B3230] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              {autoFavoritesLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Computing...
                </span>
              ) : (
                "🔄 Compute Now"
              )}
            </button>
          </div>

          {autoFavoritesPreview.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Preview Results:</h4>
              {autoFavoritesPreview.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#7B2220] text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      {p.price != null && (
                        <div className="text-sm text-gray-500">€{p.price}</div>
                      )}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {p.totalQty} sold
                  </div>
                </div>
              ))}
            </div>
          )}

          {autoFavoritesPreview.length === 0 && !autoFavoritesLoading && (
            <div className="mt-4 p-4 bg-white/50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 text-center">
                Click &quot;Compute Now&quot; to generate this week&apos;s Top 3 favorites
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Mode Section */}
      {form.favoritesMode !== "weeklyMostBought" && (
        <div>
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-2">⏳</div>
                <p className="text-sm text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 mb-4">Select 3 Favorite Products</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <ProductDropdown
                      label={`Favorite #${i + 1}`}
                      value={form.favoritesProductIds?.[i] || ""}
                      options={allProducts}
                      onChange={(productId) => setFavoriteAt(i, productId)}
                      disabled={productsLoading}
                    />
                    <p className="text-xs text-red-500 mt-1 ml-1">* Required</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
