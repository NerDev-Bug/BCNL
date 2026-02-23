import React, { useEffect, useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore"
import { db } from "../../../firebase"
import { toast } from "react-toastify"

import DataTable from "../../common/DataTable"
import { StatusBadge } from "../../common/StatusBadge"
import { RowActions } from "../../common/RowActions"
import Pagination from "../../common/Pagination"
import ConfirmationModal from "../../common/ConfirmationModal"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function History() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [copiedId, setCopiedId] = useState(null)

  // Date range filter
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "confirm",
    confirmButtonColor: "bg-[#7B2220]",
    confirmText: "Yes, Delete",
    cancelText: "Cancel",
  })

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
  }

  const TIMEZONE = "Europe/Amsterdam"

  // Real-time listener
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("paymentStatus", "in", ["delivered", "returned"])
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const getTime = (ts) => {
              if (!ts) return 0
              if (ts?.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6
              if (ts instanceof Date) return ts.getTime()
              return new Date(ts).getTime() || 0
            }
            return getTime(b.createdAt) - getTime(a.createdAt)
          })
        setOrders(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("History listener error:", err)
        setError("Failed to load orders.")
        toast.error("Failed to load orders. Please try again.")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Date range filtering (client-side)
  const filteredOrders = useMemo(() => {
    if (!startDate && !endDate) return orders

    const start = startDate ? new Date(startDate) : null
    if (start) start.setHours(0, 0, 0, 0)

    const end = endDate ? new Date(endDate) : null
    if (end) end.setHours(23, 59, 59, 999)

    return orders.filter((o) => {
      const ts = o.createdAt
      if (!ts) return false
      const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }, [orders, startDate, endDate])

  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate])

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

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  const handleDeleteOrder = (order) => {
    const orderId = typeof order === "string" ? order : order.id
    const orderNumber = `#${orderId.slice(0, 6)}`
    const customerName =
      typeof order === "object" ? order.orderData?.receiverName || "Unknown" : "Unknown"

    setConfirmationModal({
      isOpen: true,
      title: "Delete Order",
      message: `Are you sure you want to delete order ${orderNumber}${customerName !== "Unknown" ? ` for ${customerName}` : ""}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "orders", orderId))
          closeConfirmationModal()
          toast.success("History order deleted successfully")
        } catch (err) {
          console.error("Error deleting order:", err)
          toast.error("Failed to delete order. Please try again.")
          setConfirmationModal({
            isOpen: true,
            title: "Error",
            message: "Failed to delete order. Check permissions / rules.",
            onConfirm: closeConfirmationModal,
            type: "alert",
            confirmButtonColor: "bg-red-600",
          })
        }
      },
      type: "confirm",
      confirmButtonColor: "bg-red-600",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    })
  }

  // Summary based on filtered orders
  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    const paymentBreakdown = filteredOrders.reduce((acc, o) => {
      const m = o.paymentMethod || o.orderData?.paymentMethod || "Unknown"
      acc[m] = (acc[m] || 0) + 1
      return acc
    }, {})
    return { totalOrders, totalRevenue, paymentBreakdown }
  }, [filteredOrders])

  const downloadSummaryPDF = async () => {
    try {
      setDownloading(true)

      const rangeLabel =
        startDate || endDate
          ? `${startDate || "Start"} to ${endDate || "Today"}`
          : "All Time"

      const docPdf = new jsPDF()

      docPdf.setFontSize(16)
      docPdf.text("Order History Summary", 14, 16)

      docPdf.setFontSize(11)
      docPdf.text(`Period: ${rangeLabel} (${TIMEZONE})`, 14, 24)
      docPdf.text(`Total Orders: ${summary.totalOrders}`, 14, 32)
      docPdf.text(`Total Revenue: €${summary.totalRevenue.toFixed(2)}`, 14, 40)

      const pbEntries = Object.entries(summary.paymentBreakdown)
      let y = 48
      docPdf.text("Payment Breakdown:", 14, y)
      y += 6
      if (!pbEntries.length) {
        docPdf.text("—", 14, y)
        y += 6
      } else {
        pbEntries.forEach(([method, count]) => {
          docPdf.text(`• ${method}: ${count}`, 18, y)
          y += 6
        })
      }

      const rows = filteredOrders.map((o) => [
        `#${o.id.slice(0, 6)}`,
        `${formatDate(o.createdAt)} ${formatTime(o.createdAt)}`,
        o.orderData?.receiverName || "—",
        o.paymentMethod || o.orderData?.paymentMethod || "—",
        `${o.items?.length || 0}`,
        `€${Number(o.total || 0).toFixed(2)}`,
        o.paymentStatus || "—",
      ])

      autoTable(docPdf, {
        startY: y + 4,
        head: [["Order", "Date/Time", "Customer", "Payment", "Items", "Total", "Status"]],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [40, 40, 40] },
        margin: { left: 14, right: 14 },
      })

      const safeName = rangeLabel.replaceAll(" ", "-").replaceAll(",", "").replaceAll("/", "-")
      docPdf.save(`order-history-${safeName}.pdf`)
      toast.success("PDF generated and downloaded!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const columns = [
    {
      key: "expand-items",
      thClass: "sticky left-0 z-10 bg-white",
      tdClass: "sticky left-0 z-10 bg-white",
      render: (row, { isOpen, toggle }) => (
        <button onClick={toggle} className="flex items-center justify-center w-full" aria-expanded={isOpen}>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      ),
    },
    {
      key: "id",
      header: "Order",
      render: (row) => (
        <button
          onClick={() => handleCopyId(row.id)}
          title={`Copy full ID: ${row.id}`}
          className="font-mono text-xs hover:text-[#7B2220] transition-colors"
        >
          {copiedId === row.id ? "✓ Copied" : `#${row.id.slice(0, 6)}`}
        </button>
      ),
    },
    {
      key: "createdAt",
      header: "Date / Time",
      render: (row) => (
        <div>
          <p className="text-xs">{formatDate(row.createdAt)}</p>
          <p className="text-[0.65rem] text-gray-400">{formatTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: "receiverName", header: "Customer", render: (row) => row.orderData?.receiverName || "—" },
    { key: "contactnumber", header: "Contact", render: (row) => row.orderData?.contactNumber || "—" },
    { key: "paymentMethod", header: "Payment", render: (row) => <StatusBadge value={row.paymentMethod} /> },
    { key: "totalPrice", header: "Total", render: (row) => `€${Number(row.total || 0).toFixed(2)}` },
    { key: "method", header: "Delivery", render: (row) => row.orderData?.method ?? "N/A" },
    {
      key: "delivery",
      header: "Address",
      render: (row) => {
        const c = row.orderData
        if (!c) return "N/A"
        return `${c.streetName || ""}, ${c.postalCode || ""} ${c.city || ""}, ${c.country || ""}`.trim()
      },
    },
    { key: "items", header: "Items", render: (row) => `${row.items?.length || 0} items` },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.paymentStatus} /> },
    {
      key: "actions",
      header: "Action",
      thClass: "sticky right-0 z-10 bg-white",
      tdClass: "sticky right-0 z-10 bg-white",
      render: (row) => <RowActions onDelete={() => handleDeleteOrder(row)} />,
    },
  ]

  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="pt-4 w-full min-w-0">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Orders History</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Delivered & returned orders.{" "}
            {(startDate || endDate)
              ? `Filtered: ${startDate || "—"} → ${endDate || "—"}`
              : "Showing all time."}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {/* Date Range Picker */}
          <div className="flex flex-col">
            <label className="text-[0.65rem] text-gray-400 mb-0.5">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7B2220]/30"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[0.65rem] text-gray-400 mb-0.5">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              max={new Date().toISOString().slice(0, 10)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7B2220]/30"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate("") }}
              className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={downloadSummaryPDF}
            disabled={downloading || loading}
            className="px-3 py-1.5 rounded-lg bg-[#7B2220] text-white text-xs font-semibold hover:bg-[#8B3230] disabled:opacity-60 transition-colors"
          >
            {downloading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs text-center">
          <p className="text-gray-400">Orders</p>
          <p className="font-bold text-gray-900 text-lg">{summary.totalOrders}</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs text-center">
          <p className="text-gray-400">Revenue</p>
          <p className="font-bold text-[#502455] text-lg">€{summary.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="w-full min-w-0">
        <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={() => confirmationModal.onConfirm?.()}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmButtonColor={confirmationModal.confirmButtonColor}
        confirmText={confirmationModal.confirmText || "Confirm"}
        cancelText={confirmationModal.cancelText || "Cancel"}
        loading={false}
      />
    </div>
  )
}

export default History
