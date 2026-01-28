import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import Pagination from "../../common/Pagination";
import Loader from "../../common/Loader";

function OrdersPending() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Or any number of items per page


  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("status", "==", "pending")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Orders data:", data); // Add this to see the actual structure
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  const formatDate = timestamp => {
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

  const handleAcceptOrder = async orderId => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "preparing",
      });
      // Remove the order from the list immediately
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Failed to update order status.");
    }
  };

  const handleDeleteOrder = async orderId => {
    try {
      // You can implement delete logic here if needed
      console.log("Delete order:", orderId);
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  //Compute paginated orders
  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );


  const columns = [
    {
      key: "id",
      header: "Order",
      render: row => `#${row.id.slice(0, 4)}`,
    },
    {
      key: "createdAt",
      header: "Date",
      render: row => formatDate(row.createdAt),
    },
    {
      key: "receiverName",
      header: "Customer",
      render: row => row.customer?.receiverName || "—",
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: row => (
        <StatusBadge value={row.customer?.paymentMethod} />
      ),
    },
    {
      key: "totalPrice",
      header: "Total",
      render: row => `€${row.totalPrice || 0}`,
    },
    {
      key: "delivery",
      header: "Delivery",
      render: () => "N/A",
    },
    {
      key: "items",
      header: "Items",
      render: row => `${row.items?.length || 0} items`,
    },
    {
      key: "status",
      header: "Fulfillment",
      render: row => (
        <StatusBadge value={row.status} />
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: row => (
        <RowActions 
          onAccept={() => handleAcceptOrder(row.id)}
          onDelete={() => handleDeleteOrder(row.id)}
        />
      ),
    },
  ];

  if (loading) return <div className="p-6">Loading orders…</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="pt-4">
      <h2 className="mb-4 text-lg font-semibold">
        Pending Orders
      </h2>

      <DataTable columns={columns} data={paginatedOrders} />
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />
    </div>
  );
}

export default OrdersPending;
