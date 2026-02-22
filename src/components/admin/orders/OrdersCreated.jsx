// OrdersCreated.jsx — Abandoned / failed Mollie payment orders
import React, { useEffect, useState } from "react";
import {
  collection, query, where, onSnapshot,
  deleteDoc, doc,
} from "firebase/firestore";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import ConfirmationModal from "../../common/ConfirmationModal";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";
import { ChevronDown } from "lucide-react";

function OrdersCreated() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [copiedId, setCopiedId] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, order: null });

  // Real-time listener for paymentStatus === "created"
  useEffect(() => {
    const q = query(collection(db, "orders"), where("paymentStatus", "==", "created"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const t = (ts) => {
              if (!ts) return 0;
              if (ts?.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
              if (ts instanceof Date) return ts.getTime();
              return new Date(ts).getTime() || 0;
            };
            // Newest first — most recent abandoned order at top
            return t(b.createdAt) - t(a.createdAt);
          });
        setOrders(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("OrdersCreated listener error:", err);
        setError("Failed to load orders.");
        toast.error("Failed to load created orders. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const getAgeLabel = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleDeleteOrder = (order) => {
    setConfirmModal({ isOpen: true, order });
  };

  const confirmDeleteOrder = async () => {
    const order = confirmModal.order;
    if (!order) { setConfirmModal({ isOpen: false, order: null }); return; }

    try {
      await deleteDoc(doc(db, "orders", order.id));
      toast.success("Abandoned order deleted successfully");
    } catch (err) {
      console.error("Error deleting order:", err);
      toast.error("Failed to delete order");
    } finally {
      setConfirmModal({ isOpen: false, order: null });
    }
  };

  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      key: "expand-items",
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
          <p className="text-[0.65rem] text-amber-500 font-medium">{getAgeLabel(row.createdAt)}</p>
        </div>
      ),
    },
    { key: "receiverName", header: "Customer", render: (row) => row.orderData?.receiverName || "—" },
    { key: "contactnumber", header: "Contact", render: (row) => row.orderData?.contactNumber || "—" },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (row) => <StatusBadge value={row.orderData?.paymentMethod || row.paymentMethod || "Unknown"} />,
    },
    { key: "total", header: "Total", render: (row) => `€${Number(row.total || 0).toFixed(2)}` },
    { key: "items", header: "Items", render: (row) => `${row.items?.length || 0} items` },
    {
      key: "status",
      header: "Status",
      render: () => (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.65rem] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          ⏳ Awaiting Payment
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => <RowActions onDelete={() => handleDeleteOrder(row)} />,
    },
  ];

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="pt-4 w-full min-w-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pending Payment Orders</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Orders where the customer started checkout but did not complete payment (abandoned or failed Mollie redirect).
          </p>
        </div>
        {orders.length > 0 && (
          <span className="flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            {orders.length} pending
          </span>
        )}
      </div>

      <div className="w-full min-w-0">
        <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onConfirm={confirmDeleteOrder}
        onClose={() => setConfirmModal({ isOpen: false, order: null })}
        title="Delete Abandoned Order"
        message={`Are you sure you want to delete order #${confirmModal.order?.id.slice(0, 6)}? This order never received payment and can be safely removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="bg-red-600"
      />
    </div>
  );
}

export default OrdersCreated;
