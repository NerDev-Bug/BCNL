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
    <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
      <h2 className="text-lg font-bold mb-2">Favorites</h2>
      <p className="text-sm text-gray-600 mb-4">Choose how Favorites are selected.</p>

      <div className="flex flex-wrap gap-3 mb-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="favMode"
            checked={(form.favoritesMode || "manual") === "manual"}
            onChange={() => update("favoritesMode", "manual")}
          />
          Admin picks 3
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="favMode"
            checked={form.favoritesMode === "weeklyMostBought"}
            onChange={() => update("favoritesMode", "weeklyMostBought")}
          />
          Auto: Weekly Most Bought
        </label>
      </div>

      {form.favoritesMode === "weeklyMostBought" && (
        <div className="border rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold">
              This will pick Top 3 products based on this week&apos;s orders.
            </p>

            <button
              type="button"
              onClick={computeWeeklyMostBoughtTop3}
              disabled={autoFavoritesLoading || productsLoading}
              className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
            >
              {autoFavoritesLoading ? "Computing..." : "Compute Now"}
            </button>
          </div>

          {autoFavoritesPreview.length > 0 && (
            <div className="mt-4 space-y-2 text-sm">
              {autoFavoritesPreview.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span>
                    #{idx + 1} {p.name}
                    {p.price != null ? ` • €${p.price}` : ""}
                  </span>
                  <span className="text-gray-600">qty: {p.totalQty}</span>
                </div>
              ))}
            </div>
          )}

          {autoFavoritesPreview.length === 0 && !autoFavoritesLoading && (
            <p className="mt-3 text-sm text-gray-600">
              Click “Compute Now” to generate this week’s Top 3.
            </p>
          )}
        </div>
      )}

      {form.favoritesMode !== "weeklyMostBought" && (
        <>
          {productsLoading ? (
            <div className="text-sm">Loading products...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <label className="block text-sm font-semibold mb-2">
                    Product #{i + 1}
                  </label>
                  <select
                    value={form.favoritesProductIds?.[i] || ""}
                    onChange={(e) => setFavoriteAt(i, e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">— Select product —</option>
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || "Unnamed"} {p.price != null ? `• €${p.price}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
