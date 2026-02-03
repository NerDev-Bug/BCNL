import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";

import DataTable from "../common/DataTable";
import { StatusBadge } from "../common/StatusBadge";
import Pagination from "../common/Pagination";

function OrderPreparing() {
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

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          where("paymentStatus", "==", "preparing")
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

  const columns = [
    { key: "id", header: "Order", render: (row) => `#${row.id.slice(0, 4)}` },
    { key: "createdAt", header: "Date", render: (row) => formatDate(row.createdAt) },
    { key: "receiverName", header: "Customer", render: (row) => row.orderData?.receiverName || "—" },
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">No Orders Being Prepared</h2>
        <p className="text-sm text-gray-500 mt-1">You don’t have any orders in preparation right now.</p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <h2 className="mb-4 text-lg font-semibold">Preparing Orders</h2>
      <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

export default OrderPreparing;
