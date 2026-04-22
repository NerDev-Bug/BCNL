import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { ChevronDown } from "lucide-react";

import DataTable from "../common/DataTable";
import { StatusBadge } from "../common/StatusBadge";
import Pagination from "../common/Pagination";

function OrderReturn() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      where("paymentStatus", "in", ["return_requested", "returned"])
    );

    const getTime = (timestamp) => {
      if (!timestamp) return 0;
      if (timestamp?.seconds) return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
      if (timestamp instanceof Date) return timestamp.getTime();
      return new Date(timestamp).getTime() || 0;
    };

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => getTime(b.returnRequestedAt || b.createdAt) - getTime(a.returnRequestedAt || a.createdAt));
        setOrders(data);
        setCurrentPage(1);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError("Failed to load orders.");
        setLoading(false);
      }
    );

    return () => unsub();
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

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(orders.length / pageSize) || 1;
  const paginatedOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      key: "expand-items",
      render: (row, { isOpen, toggle }) => (
        <button onClick={toggle} className="flex items-center justify-center w-full" aria-expanded={isOpen}>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      ),
    },
    { key: "id", header: "Order", render: (row) => `#${row.id.slice(0, 6)}` },
    { key: "createdAt", header: "Order Date", render: (row) => formatDate(row.createdAt) },
    { key: "contactnumber", header: "Contact", render: (row) => row.orderData?.contactNumber || "—" },
    { key: "paymentMethod", header: "Payment", render: (row) => <StatusBadge value={row.orderData?.paymentMethod || row.paymentMethod} /> },
    { key: "totalPrice", header: "Total", render: (row) => `€${Number(row.total || 0).toFixed(2)}` },
    {
      key: "returnReason",
      header: "Return Reason",
      render: (row) => (
        <div className="max-w-xs px-2 py-1.5 bg-red-50 border border-red-100 rounded">
          <p className="text-sm text-gray-700" title={row.returnReason || "—"}>
            {row.returnReason || "—"}
          </p>
          {row.returnRequestedAt && (
            <p className="text-[10px] text-gray-500 mt-1">
              Requested: {formatDateTime(row.returnRequestedAt)}
            </p>
          )}
          {row.returnApprovedAt && (
            <p className="text-[10px] text-green-600 mt-1">
              Approved: {formatDateTime(row.returnApprovedAt)}
            </p>
          )}
        </div>
      ),
    },
    { key: "items", header: "Items", render: (row) => `${row.items?.length || 0} items` },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge
          value={row.paymentStatus === "return_requested" ? "Pending Approval" : row.paymentStatus}
        />
      ),
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h4l3-3m0 0l3 3H21M12 21V9" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">No Returned Orders</h2>
        <p className="text-sm text-gray-500 mt-1">You don’t have any orders that have been returned yet.</p>
      </div>
    );
  }

  return (
    <div className="pt-4 w-full min-w-0">
      <h2 className="mb-4 text-lg font-semibold text-left">Returned Orders</h2>
      <div className="w-full min-w-0">
        <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

export default OrderReturn;
