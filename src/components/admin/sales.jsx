// src/components/admin/sales.jsx
import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";

import DataTable from "../common/DataTable";
import Search from "../common/Search";
import Filter from "../common/Filter";
import Pagination from "../common/Pagination";
import { StatusBadge } from "../common/StatusBadge";
import ConfirmationModal from "../common/ConfirmationModal";
import { createRefundNotification } from "../../utils/notifications";
import { toast } from "react-toastify";

function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    order: null,
  });

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const ref = collection(db, "orders");
        const q = query(ref, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setOrders(data);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "—";

    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "—";

    return (
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const uniqueStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          (orders || [])
            .map((o) => o.paymentStatus)
            .filter((v) => typeof v === "string" && v.trim() !== "")
        )
      ),
    [orders]
  );

  const uniquePayments = useMemo(
    () =>
      Array.from(
        new Set(
          (orders || [])
            .map((o) => o.orderData?.paymentMethod || o.paymentMethod)
            .filter((v) => typeof v === "string" && v.trim() !== "")
        )
      ),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (orders || []).filter((o) => {
      const paymentMethod =
        o.orderData?.paymentMethod || o.paymentMethod || "Unknown";
      const status = o.paymentStatus || "Unknown";

      // Search: order id, receiver name, contact, payment method
      const matchesSearch =
        !term ||
        o.id.toLowerCase().includes(term) ||
        (o.orderData?.receiverName || "").toLowerCase().includes(term) ||
        String(o.orderData?.contactNumber || "")
          .toLowerCase()
          .includes(term) ||
        paymentMethod.toLowerCase().includes(term);

      const matchesStatus = !statusFilter || status === statusFilter;
      const matchesPayment =
        !paymentFilter || paymentMethod === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, paymentFilter]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleMarkRefunded = async (order) => {
    if (order.paymentStatus === "returned") return;
    setConfirmModal({ isOpen: true, order });
  };

  const confirmMarkRefunded = async () => {
    const order = confirmModal.order;
    if (!order || order.paymentStatus === "returned") {
      setConfirmModal({ isOpen: false, order: null });
      return;
    }

    try {
      setUpdatingId(order.id);

      await updateDoc(doc(db, "orders", order.id), {
        paymentStatus: "returned",
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, paymentStatus: "returned" } : o
        )
      );

      // Send notification to customer
      try {
        await createRefundNotification(order);
      } catch (notifError) {
        console.error("Error creating refund notification:", notifError);
        // Don't fail the whole operation if notification fails
      }

      toast.success("Order marked as refunded and customer notified!");
    } catch (err) {
      console.error("Failed to mark as refunded:", err);
      toast.error("Failed to update transaction. Please try again.");
    } finally {
      setUpdatingId(null);
      setConfirmModal({ isOpen: false, order: null });
    }
  };

  const columns = [
    {
      key: "id",
      header: "Order",
      render: (row) => `#${row.id.slice(0, 6)}`,
    },
    {
      key: "createdAt",
      header: "Date / Time",
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: "receiverName",
      header: "Customer",
      render: (row) => row.orderData?.receiverName || "—",
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (row) => (
        <StatusBadge
          value={row.orderData?.paymentMethod || row.paymentMethod || "Unknown"}
        />
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (row) => `€${Number(row.total || 0).toFixed(2)}`,
    },
    {
      key: "items",
      header: "Items",
      render: (row) => `${row.items?.length || 0} items`,
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (row) => <StatusBadge value={row.paymentStatus || "Unknown"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleMarkRefunded(row)}
          disabled={
            updatingId === row.id || row.paymentStatus === "returned"
          }
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
            row.paymentStatus === "returned"
              ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
              : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
          }`}
        >
          {row.paymentStatus === "returned"
            ? "Refunded"
            : updatingId === row.id
            ? "Updating..."
            : "Mark as Refunded"}
        </button>
      ),
    },
  ];

  const totalRevenue = filteredOrders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  return (
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        {/* HEADER */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Sales / Transactions
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-2xl break-words">
                Real-time list of all POS transactions with search, filters,
                and refund handling. Use this view for end-of-day reconciliation
                and audits.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end flex-shrink-0">
              <span className="text-xs uppercase tracking-wide text-gray-500">
                Filtered Revenue
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#502455]">
                €{totalRevenue.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400">
                {filteredOrders.length} transactions
              </span>
            </div>
          </div>

          {/* SEARCH + FILTERS: stack on small screens */}
          <div className="mt-4 sm:mt-6 bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
              <div className="w-full min-w-0 sm:flex-1 sm:min-w-[180px]">
                <Search
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by order ID, customer, contact"
                />
              </div>

              <div className="w-full sm:w-auto sm:min-w-[140px]">
                <Filter
                  label="Payment Status"
                  value={statusFilter}
                  options={uniqueStatuses}
                  onChange={setStatusFilter}
                />
              </div>

              <div className="w-full sm:w-auto sm:min-w-[140px]">
                <Filter
                  label="Payment Method"
                  value={paymentFilter}
                  options={uniquePayments}
                  onChange={setPaymentFilter}
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE – same scroll-inside pattern as src/components/order */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-w-0">
          <div className="w-full min-w-0">
            <DataTable columns={columns} data={paginatedOrders} loading={loading} />
          </div>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onConfirm={confirmMarkRefunded}
        onClose={() => setConfirmModal({ isOpen: false, order: null })}
        title="Mark as Refunded"
        message={`Are you sure you want to mark order #${confirmModal.order?.id.slice(0, 6)} as refunded/returned? The customer will be notified.`}
        confirmText="Mark as Refunded"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
}

export default SalesPage;

