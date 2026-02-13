import React, { useEffect, useMemo, useState } from "react"
import {
  collection,
  query,
  where,
  getDocs,
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

  // ✅ Confirmation modal state
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

  // ✅ Netherlands timezone
  const TIMEZONE = "Europe/Amsterdam"

  useEffect(() => {
    const fetchHistoryOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        const q = query(
          collection(db, "orders"),
          where("paymentStatus", "in", ["delivered", "returned"])
        );

        const snapshot = await getDocs(q)

        const data = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            // Sort by createdAt: oldest first (ascending)
            const getTime = (timestamp) => {
              if (!timestamp) return 0
              if (timestamp?.seconds) return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
              if (timestamp instanceof Date) return timestamp.getTime()
              return new Date(timestamp).getTime() || 0
            }
            return getTime(a.createdAt) - getTime(b.createdAt)
          })

        // console.log("History Orders data:", data);
        setOrders(data)
        setCurrentPage(1)
      } catch (err) {
        console.error(err)
        setError("Failed to load orders.")
        toast.error("Failed to load orders. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryOrders()
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

  const handleDeleteOrder = (order) => {
    const orderId = typeof order === "string" ? order : order.id
    const orderNumber = `#${orderId.slice(0, 4)}`
    const customerName = typeof order === "object" ? order.orderData?.receiverName || "Unknown" : "Unknown"

    setConfirmationModal({
      isOpen: true,
      title: "Delete Order",
      message: `Are you sure you want to delete order ${orderNumber}${customerName !== "Unknown" ? ` for ${customerName}` : ""}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "orders", orderId))
          setOrders((prev) => prev.filter((o) => o.id !== orderId))
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

  // ✅ Summary (whole day)
  const summary = useMemo(() => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    )

    const paymentBreakdown = orders.reduce((acc, o) => {
      const m = o.paymentMethod || o.orderData?.paymentMethod || "Unknown"
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
      toast.success("PDF generated and downloaded successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate PDF. Please try again.")
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
          onDelete={() => handleDeleteOrder(row)}
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={() => {
          if (confirmationModal.onConfirm) {
            confirmationModal.onConfirm()
          }
        }}
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
