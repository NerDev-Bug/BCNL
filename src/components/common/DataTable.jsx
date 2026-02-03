import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getProduct } from "../../hooks/useProductCache";

/* =========================
   Expanded Item Row
   ========================= */
function ExpandedItemRow({ item }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    let mounted = true;

    getProduct(item.productId).then(data => {
      if (mounted) setProduct(data);
    });

    return () => {
      mounted = false;
    };
  }, [item.productId]);

  if (!product) {
    return (
      <div className="py-3 text-sm text-gray-400">
        Loading product…
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
      {/* Product Image */}
      <img
        src={product.image}
        alt={product.name}
        className="w-12 h-12 rounded object-cover"
      />

      {/* Name + Category */}
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          {product.name}
        </div>
        <div className="text-xs text-gray-500">
          {product.category}
        </div>
      </div>

      {/* Quantity */}
      <div className="text-sm text-gray-700">
        Qty: {item.quantity}
      </div>

      {/* Price */}
      <div className="text-sm font-medium text-gray-900">
        €{Number(item.price).toFixed(2)}
      </div>
    </div>
  );
}

/* =========================
   DataTable
   ========================= */
function DataTable({ columns, data, rowKey = "id", loading = false }) {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = rowId => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <table className="w-full border-collapse">
        <thead className="border-b border-gray-200">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`}>
                {columns.map(col => (
                  <td key={`${col.key}-${idx}`} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : !data || data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-sm text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map(row => {
              const rowId = row[rowKey];
              const isOpen = expandedRows[rowId];

              return (
                <React.Fragment key={rowId}>
                  {/* MAIN ROW */}
                  <tr className="hover:bg-gray-50">
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className="px-6 py-4 text-sm text-gray-900"
                      >
                        {col.render
                          ? col.render(row, {
                              isOpen,
                              toggle: () => toggleRow(rowId),
                            })
                          : row[col.key] ?? "—"}
                      </td>
                    ))}
                  </tr>

                  {/* EXPANDED ROW */}
                  {isOpen && (
                    <tr className="bg-gray-50">
                      <td colSpan={columns.length} className="px-6 pb-4">
                        <div className="mt-2">
                          {row.items?.map((item, idx) => (
                            <ExpandedItemRow
                              key={`${rowId}-${idx}`}
                              item={item}
                            />
                          ))}
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
  );
}

export default DataTable;
