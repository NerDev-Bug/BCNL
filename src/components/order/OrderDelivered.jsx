import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";

import DataTable from "../common/DataTable";
import { StatusBadge } from "../common/StatusBadge";
import Pagination from "../common/Pagination";
import ReasonForReturn from "../modals/ReasonForReturn";

function OrderDelivered() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Fetch orders
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          where("paymentStatus", "==", "delivered")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(data);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalPages = Math.ceil(orders.length / pageSize) || 1;
  const paginatedOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleReturnClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedOrder(null);
    // Refresh orders after return request is submitted
    if (user) {
      const fetchOrders = async () => {
        try {
          const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid),
            where("paymentStatus", "==", "delivered")
          );
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setOrders(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchOrders();
    }
  };

  const columns = [
    { key: "id", header: "Order", render: (row) => `#${row.id.slice(0, 4)}` },
    { key: "createdAt", header: "Date", render: (row) => formatDate(row.createdAt) },
    { key: "contactnumber", header: "Contact", render: (row) => row.orderData?.contactNumber || "—" },
    { key: "paymentMethod", header: "Payment", render: (row) => <StatusBadge value={row.orderData?.paymentMethod || row.paymentMethod} /> },
    { key: "totalPrice", header: "Total", render: (row) => `€${Number(row.total || 0).toFixed(2)}` },
    {
      key: "delivery",
      header: "Delivery",
      render: (row) => {
        const c = row.orderData;
        if (!c) return "N/A";
        return `${c.streetName || ""}, ${c.postalCode || ""} ${c.city || ""}, ${c.country || ""}`.trim();
      },
    },
    { key: "items", header: "Items", render: (row) => `${row.items?.length || 0} items` },
    { key: "status", header: "Fulfillment", render: (row) => <StatusBadge value={row.paymentStatus} /> },
    {
      key: "action",
      header: "Action",
      render: (row) => {
        const deliveryDate = row.deliveredAt || row.createdAt;
        const deliveryTimestamp = deliveryDate?.seconds
          ? new Date(deliveryDate.seconds * 1000)
          : new Date(deliveryDate);

        const now = new Date();
        const diffInDays = Math.floor(
          (now - deliveryTimestamp) / (1000 * 60 * 60 * 24)
        );

        const hasRejectedReturn = !!row.returnRejectedAt;

        // Disable if older than 7 days or rejected
        const isDisabled = diffInDays > 7 || hasRejectedReturn;

        return (
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <button
              onClick={() => handleReturnClick(row)}
              disabled={isDisabled}
              className={`px-3 py-1 text-white rounded text-sm w-fit ${
                isDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {hasRejectedReturn
                ? "Return Rejected"
                : diffInDays > 7
                ? "Return Expired"
                : "Return"}
            </button>
            {hasRejectedReturn && row.returnRejectionReason && (
              <div className="text-xs text-left px-2 py-1.5 bg-red-50 border border-red-100 rounded" title={row.returnRejectionReason}>
                <span className="font-medium text-red-700">Reason: </span>
                <span className="text-gray-700">{row.returnRejectionReason}</span>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  if (!user) {
    return (
      <div className="bg-white border rounded-lg py-16 flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-semibold text-gray-700">Please log in</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to view your orders.</p>
      </div>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="bg-white border rounded-lg py-16 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">No Delivered Orders</h2>
        <p className="text-sm text-gray-500 mt-1">You don’t have any orders that have been delivered yet.</p>
      </div>
    );
  }

  return (
    <div className="pt-4 w-full min-w-0">
      <h2 className="mb-4 text-lg font-semibold text-left">Delivered Orders</h2>
      <div className="w-full min-w-0">
        <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showModal && selectedOrder && (
        <ReasonForReturn order={selectedOrder} onClose={handleModalClose} />
      )}
    </div>
  );
}

export default OrderDelivered;