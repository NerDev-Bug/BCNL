import React, { useEffect, useState } from "react";
import { getProduct } from "../../hooks/useProductCache";

/* =========================
   Expanded Item Row
   ========================= */
function BundleItemRow({ item }) {
  const c = item.customization;
  const firstImage = item.bundleItems?.find((bi) => bi.productImage)?.productImage || null;

  return (
    <div className="flex gap-4 py-4 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
      {/* Bundle icon / first product image */}
      <div className="w-16 h-16 rounded-xl border-2 border-purple-200 shadow-sm bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        {firstImage ? (
          <img src={firstImage} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">📦</span>
        )}
      </div>

      {/* Bundle name + items breakdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">{item.name}</span>
          <span className="inline-block bg-purple-100 text-purple-700 text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full">
            Bundle
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {(item.bundleItems || []).map((bi) => (
            <div
              key={bi.productId}
              className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5"
            >
              {bi.productImage && (
                <img src={bi.productImage} alt={bi.productName} className="w-4 h-4 rounded object-cover" />
              )}
              <span className="text-xs text-gray-700">
                {bi.productName}
                {bi.qty > 1 && <span className="text-gray-400"> ×{bi.qty}</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Customization (if any) */}
        {c && (
          <div className="mt-2 space-y-1 text-xs">
            {c.pickupDate && (
              <div className="inline-block px-2 py-1 bg-teal-50 text-teal-700 rounded-lg mr-2">
                Pick-up Date: {c.pickupDate}
              </div>
            )}
            {c.pickupTime && (
              <div className="inline-block px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg mr-2">
                Pick-up Time: {c.pickupTime}
              </div>
            )}
            {c.cardMessage && (
              <div className="mt-2 rounded-xl border border-[#7B2220]/20 bg-gradient-to-br from-[#7B2220]/5 to-rose-50 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#7B2220]/10 bg-[#7B2220]/5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#7B2220]">Card Message</span>
                </div>
                <p className="px-3 py-2.5 text-xs italic text-gray-700 leading-relaxed font-semibold">
                  &ldquo;{c.cardMessage}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="flex items-center flex-shrink-0">
        <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
          Qty: {item.quantity}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center flex-shrink-0">
        <div className="text-right">
          <div className="text-base font-bold text-[#7B2220]">
            €{Number(item.price).toFixed(2)}
          </div>
          <div className="text-[0.65rem] text-gray-400">bundle price</div>
        </div>
      </div>
    </div>
  );
}

function ExpandedItemRow({ item }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Skip Firestore fetch for bundle items
    if (item.isBundle) return;

    let mounted = true;
    getProduct(item.productId).then(data => {
      if (mounted) setProduct(data);
    });
    return () => { mounted = false; };
  }, [item.productId, item.isBundle]);

  // Bundle items: render without Firestore product lookup
  if (item.isBundle) {
    return <BundleItemRow item={item} />;
  }

  if (!product) {
    return (
      <div className="py-4 px-4 flex items-center gap-3">
        <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  const c = item.customization;

  return (
    <div className="flex gap-4 py-4 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
      {/* Product Image */}
      <img
        src={product.image}
        alt={product.name}
        className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
      />

      {/* Product + Customization */}
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-1">
          {product.name}
        </div>
        
        {/* Category */}
        <div className="text-xs text-gray-500 mb-2">
          {product.category}
        </div>

        {/* 👉 CUSTOMIZATION (ONLY IF EXISTS) */}
        {c && (
          <div className="mt-2 space-y-1 text-xs">
            {c.size && (
              <div className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-lg mr-2">
                Size: {c.size}
              </div>
            )}
            {c.candles && (
              <div className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded-lg mr-2">
                Candles: {c.candles}
              </div>
            )}
            {c.deliveryDate && (
              <div className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded-lg mr-2">
                Date: {c.deliveryDate}
              </div>
            )}
            {c.deliveryTime && (
              <div className="inline-block px-2 py-1 bg-orange-50 text-orange-700 rounded-lg mr-2">
                Time: {c.deliveryTime}
              </div>
            )}
            {c.pickupDate && (
              <div className="inline-block px-2 py-1 bg-teal-50 text-teal-700 rounded-lg mr-2">
                Pick-up Date: {c.pickupDate}
              </div>
            )}
            {c.pickupTime && (
              <div className="inline-block px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg mr-2">
                Pick-up Time: {c.pickupTime}
              </div>
            )}
            {c.cardMessage && (
              <div className="mt-3 rounded-xl border border-[#7B2220]/20 bg-gradient-to-br from-[#7B2220]/5 to-rose-50 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#7B2220]/10 bg-[#7B2220]/5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#7B2220]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#7B2220]">
                    Card Message
                  </span>
                </div>
                <p className="px-3 py-2.5 text-xs italic text-gray-700 leading-relaxed font-semibold">
                  &ldquo;{c.cardMessage}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Promo / Bundle badges */}
      <div className="flex flex-col gap-1.5 justify-center min-w-[120px]">
        {/* B1T1 badge */}
        {item.productDiscount?.type === "buy1take1" && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-xs font-bold text-red-600">🎁 Buy 1 Take 1</span>
            {item.productDiscount.promoPrice > 0 && (
              <span className="text-[0.65rem] text-red-400">
                · €{Number(item.productDiscount.promoPrice).toFixed(2)}
              </span>
            )}
          </div>
        )}
        {/* X-for-Y badge */}
        {item.productDiscount?.type === "xForY" && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-xs font-bold text-orange-600">
              🏷️ {item.productDiscount.buyQty} for €{Number(item.productDiscount.forPrice).toFixed(2)}
            </span>
          </div>
        )}
        {/* Percent/fixed discount badge */}
        {item.productDiscount?.type === "percent" && (
          <div className="inline-flex items-center px-2 py-1 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-xs font-bold text-green-600">
              {item.productDiscount.value}% OFF
            </span>
          </div>
        )}
        {item.productDiscount?.type === "fixed" && (
          <div className="inline-flex items-center px-2 py-1 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-xs font-bold text-green-600">
              €{Number(item.productDiscount.value).toFixed(2)} OFF
            </span>
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="flex items-center">
        <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
          Qty: {item.quantity}
          {/* B1T1 free items note */}
          {item.productDiscount?.type === "buy1take1" && item.quantity >= 2 && (
            <span className="block text-[0.65rem] text-green-600 font-semibold mt-0.5">
              ({Math.floor(item.quantity / 2)} free)
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center">
        <div className="text-right">
          <div className="text-base font-bold text-[#7B2220]">
            €{Number(item.price).toFixed(2)}
          </div>
          <div className="text-[0.65rem] text-gray-400">unit price</div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   DataTable
   ========================= */
function DataTable({ columns, data, rowKey = "id", loading = false, getRowClassName }) {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = rowId => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden min-w-0">
      <div className="overflow-x-auto w-full min-w-0">
        <table className="w-full border-collapse text-xs sm:text-sm min-w-[600px]">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-center text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="hover:bg-gray-50 transition-colors">
                  {columns.map(col => (
                    <td key={`${col.key}-${idx}`} className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                      <div className="h-4 sm:h-5 bg-gray-200 rounded-lg animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data || data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 sm:px-6 sm:py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-4xl sm:text-5xl mb-4">📦</div>
                    <p className="text-base sm:text-lg font-semibold text-gray-900 mb-1">No data available</p>
                    <p className="text-xs sm:text-sm text-gray-500">There are no items to display at this time</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(row => {
                const rowId = row[rowKey];
                const isOpen = expandedRows[rowId];
                const customClassName = getRowClassName ? getRowClassName(row) : "";
                const baseClassName = "hover:bg-gray-50 transition-colors duration-150 cursor-pointer";
                const rowClassName = customClassName ? `${baseClassName} ${customClassName}` : baseClassName;

                return (
                  <React.Fragment key={rowId}>
                    {/* MAIN ROW */}
                    <tr className={rowClassName}>
                      {columns.map(col => (
                        <td
                          key={col.key}
                          className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm text-gray-900"
                        >
                          {col.render
                            ? col.render(row, {
                                isOpen,
                                toggle: () => toggleRow(rowId),
                              })
                            : row[col.key] ?? (
                              <span className="text-gray-400">—</span>
                            )}
                        </td>
                      ))}
                    </tr>

                    {/* EXPANDED ROW */}
                    {isOpen && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={columns.length} className="px-3 py-3 sm:px-6 sm:py-4">
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-2">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                              <h4 className="text-sm font-semibold text-gray-900">Order Items</h4>
                            </div>
                            <div>
                              {row.items?.map((item, idx) => (
                                <ExpandedItemRow
                                  key={`${rowId}-${idx}`}
                                  item={item}
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
