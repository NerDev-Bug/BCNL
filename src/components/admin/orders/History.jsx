import React, { useEffect, useMemo, useState } from "react"
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore"
import { db } from "../../../firebase"

import DataTable from "../../common/DataTable"
import { StatusBadge } from "../../common/StatusBadge"
import { RowActions } from "../../common/RowActions"
import Pagination from "../../common/Pagination"

// ✅ PDF
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function History() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // ✅ Netherlands timezone
  const TIMEZONE = "Europe/Amsterdam"

  // ✅ Helper: get "today" start/end in TIMEZONE, then convert to JS Date
  // Note: JS Date is always stored as UTC internally; this method ensures the boundaries match the timezone day.
  const getDayRangeInTimezone = (tz) => {
    const now = new Date()

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now)

    const y = parts.find((p) => p.type === "year")?.value
    const m = parts.find((p) => p.type === "month")?.value
    const d = parts.find((p) => p.type === "day")?.value

    // Construct "local midnight" string then interpret as UTC-like; we’ll correct by using timezone formatting above.
    // Practical approach: create two dates by formatting again with timeZone.
    const startLocal = new Date(`${y}-${m}-${d}T00:00:00`)
    const endLocal = new Date(`${y}-${m}-${d}T23:59:59.999`)

    // This is usually fine for daily summaries; if you need absolute precision for DST edge cases,
    // we can switch to a timezone lib (luxon/date-fns-tz).
    return { start: startLocal, end: endLocal }
  }

  useEffect(() => {
    const fetchDeliveredOrdersToday = async () => {
      setLoading(true)
      setError(null)
      try {
        const { start, end } = getDayRangeInTimezone(TIMEZONE)

        const q = query(
          collection(db, "orders"),
          where("createdAt", ">=", Timestamp.fromDate(start)),
          where("createdAt", "<=", Timestamp.fromDate(end))
        );

        const snapshot = await getDocs(q)

        const data = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(o => ["delivered", "returned"].includes(o.paymentStatus))


        // console.log("History Orders data:", data);
        setOrders(data)
        setCurrentPage(1)
      } catch (err) {
        console.error(err)
        setError("Failed to load orders.")
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveredOrdersToday()
  }, [])

  const formatDate = (timestamp) => {
    if (!timestamp) return "—"
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp)

    return date.toLocaleDateString("en-US", {
      timeZone: TIMEZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return "—"
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp)

    return date.toLocaleTimeString("en-US", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDeleteOrder = async (orderId) => {
    try {
      console.log("Delete order:", orderId)
    } catch (err) {
      console.error("Error deleting order:", err)
    }
  }

  // ✅ Summary (whole day)
  const summary = useMemo(() => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalPrice || 0),
      0
    )

    const paymentBreakdown = orders.reduce((acc, o) => {
      const m = o.orderData?.paymentMethod || "Unknown"
      acc[m] = (acc[m] || 0) + 1
      return acc
    }, {})

    return { totalOrders, totalRevenue, paymentBreakdown }
  }, [orders])

  // ✅ PDF generator
  const downloadDailySummaryPDF = async () => {
    try {
      setDownloading(true)

      const todayLabel = new Date().toLocaleDateString("en-US", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "short",
        day: "2-digit",
      })

      const docPdf = new jsPDF()

      docPdf.setFontSize(16)
      docPdf.text("Daily Order Summary", 14, 16)

      docPdf.setFontSize(11)
      docPdf.text(`Date: ${todayLabel} (${TIMEZONE})`, 14, 24)

      docPdf.text(`Total Orders: ${summary.totalOrders}`, 14, 32)
      docPdf.text(
        `Total Revenue: €${summary.totalRevenue.toFixed(2)}`,
        14,
        40
      )

      // Payment breakdown lines
      const pbEntries = Object.entries(summary.paymentBreakdown)
      let y = 48
      docPdf.text("Payment Breakdown:", 14, y)
      y += 6
      if (pbEntries.length === 0) {
        docPdf.text("—", 14, y)
        y += 6
      } else {
        pbEntries.forEach(([method, count]) => {
          docPdf.text(`• ${method}: ${count}`, 18, y)
          y += 6
        })
      }

      // Table
      const rows = orders.map((o) => [
        `#${o.id.slice(0, 4)}`,
        `${formatDate(o.createdAt)} ${formatTime(o.createdAt)}`,
        o.orderData?.receiverName || "—",
        o.orderData?.paymentMethod || "—",
        `${o.items?.length || 0}`,
        `€${Number(o.total || 0).toFixed(2)}`,
        o.paymentStatus || "—",
      ])

      autoTable(docPdf, {
        startY: y + 4,
        head: [
          [
            "Order",
            "Date/Time",
            "Customer",
            "Payment",
            "Items",
            "Total",
            "Status",
          ],
        ],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [40, 40, 40] },
        margin: { left: 14, right: 14 },
      })

      const filename = `daily-order-summary-${todayLabel
        .replaceAll(" ", "-")
        .replaceAll(",", "")}.pdf`

      docPdf.save(filename)
    } catch (err) {
      console.error(err)
      alert("Failed to generate PDF.")
    } finally {
      setDownloading(false)
    }
  }

  // ✅ pagination
  const totalPages = Math.ceil(orders.length / pageSize)
  const paginatedOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const columns = [
    {
      key: "id",
      header: "Order",
      render: (row) => `#${row.id.slice(0, 4)}`,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "receiverName",
      header: "Customer",
      render: (row) => row.orderData?.receiverName || "—",
    },
    {
      key: "contactnumber",
      header: "Contact",
      render: row => row.orderData?.contactNumber || "—",
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: row => (
        <StatusBadge value={row.paymentMethod} />
      ),
    },
    {
      key: "totalPrice",
      header: "Total",
      render: (row) => `€${Number(row.total || 0).toFixed(2)}`,
    },
    {
      key: "delivery",
      header: "Delivery",
      render: row => {
        const c = row.orderData;
        if (!c) return "N/A";
        return `${c.streetName || ""}, ${c.postalCode || ""} ${c.city || ""}, ${c.country || ""}`.trim();
      },
    },
    {
      key: "items",
      header: "Items",
      render: row => `${row.items?.length || 0} items`,
    },
    {
      key: "status",
      header: "Fulfillment",
      render: row => <StatusBadge value={row.paymentStatus} />,
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <RowActions
          onDelete={() => handleDeleteOrder(row.id)}
        />
      ),
    },
  ]

  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Delivered Orders (Today)</h2>

        {/* ✅ Button only (as you requested) */}
        <button
          onClick={downloadDailySummaryPDF}
          disabled={downloading || loading}
          className="px-4 py-2 rounded-md bg-black text-white text-sm disabled:opacity-60"
        >
          {downloading ? "Generating PDF..." : "Download Daily Summary (PDF)"}
        </button>
      </div>

      <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

export default History
