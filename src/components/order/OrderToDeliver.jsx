import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { ChevronDown } from "lucide-react";

import DataTable from "../common/DataTable";
import { StatusBadge } from "../common/StatusBadge";
import Pagination from "../common/Pagination";

function OrderToDeliver() {
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
      where("paymentStatus", "==", "to_delivered")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    { key: "createdAt", header: "Date", render: (row) => formatDate(row.createdAt) },
    { key: "paymentMethod", header: "Payment", render: (row) => <StatusBadge value={row.orderData?.paymentMethod || row.paymentMethod} /> },
    { key: "totalPrice", header: "Total", render: (row) => `€${Number(row.total || 0).toFixed(2)}` },
    { key: "items", header: "Items", render: (row) => `${row.items?.length || 0} items` },
    { key: "status", header: "Fulfillment", render: (row) => <StatusBadge value={row.paymentStatus} /> },
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18v4H3V3zM3 9h18v12H3V9z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">No Orders To Deliver</h2>
        <p className="text-sm text-gray-500 mt-1">You don’t have any orders ready for delivery right now.</p>
      </div>
    );
  }

  return (
    <div className="pt-4 w-full min-w-0">
      <h2 className="mb-4 text-lg font-semibold text-left">To Deliver</h2>
      <div className="w-full min-w-0">
        <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

export default OrderToDeliver;
