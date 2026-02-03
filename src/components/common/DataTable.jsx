import React from "react";

function DataTable({ columns, data, rowKey = "id", loading = false }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead className="bg-white border-b border-gray-200">
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
            // Loading skeleton rows
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={`${col.key}-${idx}`} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : (!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 text-sm">
                No data available
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={row[rowKey]}
                className="hover:bg-gray-50 transition"
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className="px-6 py-4 text-sm text-gray-900"
                  >
                    {col.render
                      ? col.render(row)
                      : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
