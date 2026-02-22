// src/components/admin/DownloadCSV-PDF.jsx
import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Download array of row objects as CSV file.
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} filename
 */
export function downloadCsv(rows, filename) {
  if (!rows || !rows.length) {
    alert("No data to export.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val == null) return "";
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csv =
    headers.join(",") +
    "\n" +
    rows
      .map((row) => headers.map((h) => escape(row[h])).join(","))
      .join("\n");

  // Prepend UTF-8 BOM so Excel correctly reads special characters like €
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download array of row objects as PDF table.
 * @param {Array<Record<string, unknown>>} rows
 * @param {{ title?: string; filename?: string }} options
 */
export function downloadPdfFromTable(rows, options = {}) {
  const { title = "Report", filename = "report.pdf" } = options;

  if (!rows || !rows.length) {
    alert("No data to export.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const head = [headers.map((h) => String(h))];
  const body = rows.map((row) => headers.map((h) => String(row[h] ?? "")));

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head,
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [123, 34, 32] },
  });

  doc.save(filename);
}

const INVENTORY_COLUMNS = [
  { key: "name", label: "Name", readOnly: false },
  { key: "category", label: "Category", readOnly: false },
  { key: "price", label: "Price", readOnly: false },
  { key: "dailyLimit", label: "Daily Limit", readOnly: false },
  { key: "hasDiscount", label: "Has Discount", readOnly: false },
];

/**
 * Modal to edit inventory report rows and download as CSV or PDF.
 */
export function InventoryReportModal({
  rows,
  onUpdateRow,
  onClose,
  onDownloadCsv,
  onDownloadPdf,
}) {
  const modalContent = (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Inventory Report</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Edit the table below, then download as CSV or PDF.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-auto px-6 py-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {INVENTORY_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="text-left py-2 px-2 font-semibold text-gray-700 whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50/50"
                  >
                    {INVENTORY_COLUMNS.map((col) => (
                      <td key={col.key} className="py-1 px-2">
                        {col.readOnly ? (
                          <span className="text-gray-600 font-mono text-xs">
                            {row[col.key]}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={row[col.key] ?? ""}
                            onChange={(e) =>
                              onUpdateRow(index, col.key, e.target.value)
                            }
                            className="w-full min-w-0 px-2 py-1.5 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B2220]/40 focus:border-[#7B2220]/50"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDownloadCsv}
              className="px-5 py-2.5 rounded-xl border-2 border-[#7B2220] text-[#7B2220] font-semibold hover:bg-[#7B2220]/5"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={onDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-[#7B2220] text-white font-semibold hover:bg-[#8B3230] shadow-md"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}

const ORDERS_COLUMNS = [
  { key: "date", label: "Date", readOnly: true },
  { key: "customer", label: "Customer", readOnly: false },
  { key: "paymentMethod", label: "Payment Method", readOnly: false },
  { key: "itemsCount", label: "Items Count", readOnly: false },
  { key: "total", label: "Total", readOnly: false },
  { key: "paymentStatus", label: "Payment Status", readOnly: false },
];

/**
 * Modal to edit sales & orders report rows and download as CSV or PDF.
 * Includes built-in date range picker and order filtering.
 */
export function SalesOrdersReportModal({
  orders,
  formatDateTime,
  onClose,
  onDownloadCsv,
  onDownloadPdf,
}) {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  })();

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const filteredRows = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return (orders || [])
      .filter((o) => {
        const ts = o.createdAt;
        if (!ts) return false;
        const date =
          typeof ts === "object" && ts.seconds
            ? new Date(ts.seconds * 1000)
            : new Date(ts);
        return date >= start && date <= end;
      })
      .map((o) => ({
        date: formatDateTime ? formatDateTime(o.createdAt) : String(o.createdAt),
        customer: o.orderData?.receiverName || "",
        paymentMethod: o.orderData?.paymentMethod || o.paymentMethod || "",
        itemsCount: String(o.items?.length || 0),
        total: Number(o.total || 0).toFixed(2),
        paymentStatus: o.paymentStatus || "",
      }));
  }, [orders, startDate, endDate, formatDateTime]);

  const [overrides, setOverrides] = useState({});

  // Clear overrides when date range changes (useEffect, not during render)
  useEffect(() => {
    setOverrides({});
  }, [startDate, endDate]);

  const rows = filteredRows.map((row, i) =>
    overrides[i] ? { ...row, ...overrides[i] } : row
  );

  const updateRow = (index, field, value) => {
    setOverrides((prev) => ({
      ...prev,
      [index]: { ...(prev[index] || {}), [field]: value },
    }));
  };

  const totalValue = filteredRows.reduce((sum, r) => sum + Number(r.total || 0), 0);

  const handleDownloadCsv = () => {
    const rowsWithHeaders = rows.map((row) => ({
      Date: row.date,
      Customer: row.customer,
      "Payment Method": row.paymentMethod,
      "Items Count": row.itemsCount,
      Total: row.total,
      "Payment Status": row.paymentStatus,
    }));
    onDownloadCsv(rowsWithHeaders);
  };

  const handleDownloadPdf = () => {
    const rowsWithHeaders = rows.map((row) => ({
      Date: row.date,
      Customer: row.customer,
      "Payment Method": row.paymentMethod,
      "Items Count": row.itemsCount,
      Total: row.total,
      "Payment Status": row.paymentStatus,
    }));
    onDownloadPdf(rowsWithHeaders);
  };

  const modalContent = (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sales & Orders Report</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Select date range, edit the table below, then download as CSV or PDF.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Date Range Picker inside modal */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220] focus:border-transparent bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220] focus:border-transparent bg-white"
                />
              </div>
              <div className="flex-1 sm:flex-none">
                <p className="text-sm text-gray-600 py-2">
                  <span className="font-semibold">{filteredRows.length}</span> orders found
                  {filteredRows.length > 0 && (
                    <span className="ml-1 text-gray-500">(€{totalValue.toFixed(2)})</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-4">
            {rows.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                No orders found for the selected date range.
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {ORDERS_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="text-left py-2 px-2 font-semibold text-gray-700 whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      {ORDERS_COLUMNS.map((col) => (
                        <td key={col.key} className="py-1 px-2">
                          {col.readOnly ? (
                            <span className="text-gray-600 font-mono text-xs">
                              {row[col.key]}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={row[col.key] ?? ""}
                              onChange={(e) => updateRow(index, col.key, e.target.value)}
                              className="w-full min-w-0 px-2 py-1.5 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B2220]/40 focus:border-[#7B2220]/50"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={rows.length === 0}
              className="px-5 py-2.5 rounded-xl border-2 border-[#7B2220] text-[#7B2220] font-semibold hover:bg-[#7B2220]/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={rows.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#7B2220] text-white font-semibold hover:bg-[#8B3230] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}

export default { downloadCsv, downloadPdfFromTable, InventoryReportModal, SalesOrdersReportModal };
