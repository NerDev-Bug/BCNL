import React from "react";

function DataTable({ columns, data, rowKey = "id" }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-medium text-gray-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
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
                    className="px-4 py-3 text-gray-900"
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
