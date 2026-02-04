// OrdersPreparing.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";
import { ChevronDown } from "lucide-react";

function OrdersPreparing() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const fetchPreparingOrders = async () => {
      try {
        const q = query(collection(db, "orders"), where("paymentStatus", "==", "preparing"));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        // console.log("Preparing Orders data:", data);
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreparingOrders();
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

  // Handle deleting an order
  const handleDeleteOrder = async orderId => {
    try {
      const orderDeleteRef = doc(db, "orders", orderId);
      await deleteDoc(orderDeleteRef);
      setOrders(orders.filter(order => order.id !== orderId));
      // You can implement delete logic here if needed
      console.log("Delete order:", orderId);
      toast.success("Preparing order deleted successfully");
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  // ✅ New: Handle Accept Order (preparing -> to_delivered)
  const handleAcceptOrder = async orderId => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        paymentStatus: "to_delivered",
      });

      // Remove the order from the list immediately
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Failed to update order status.");
    }
  };

  // Compute paginated orders
  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      key: "expand-items",
      render: (row, { isOpen, toggle }) => (
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full"
          aria-expanded={isOpen}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      ),
    },
    {
      key: "id",
      header: "Order",
      render: row => `#${row.id.slice(0, 4)}`
    },
    {
      key: "createdAt",
      header: "Date",
      render: row => formatDate(row.createdAt)
    },
    {
      key: "receiverName",
      header: "Customer",
      render: row => row.orderData?.receiverName || "—"
    },
    {
      key: "contactnumber",
      header: "Contact",
      render: row => row.orderData?.contactNumber || "—",
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: row => <StatusBadge value={row.paymentMethod} />
    },
    {
      key: "totalPrice",
      header: "Total",
      render: row => `€${Number(row.total || 0).toFixed(2)}`
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
      render: row => `${row.items?.length || 0} items`
    },
    {
      key: "status",
      header: "Fulfillment",
      render: row => <StatusBadge value={row.paymentStatus} />
    },
    {
      key: "actions",
      header: "Action",
      render: row => (
        <RowActions
          onAccept={() => handleAcceptOrder(row.id)} // ✅ Accept button
          onDelete={() => handleDeleteOrder(row.id)}
          acceptLabel="To Delivered"
        />
      ),
    },
  ];

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="pt-4">
      <h2 className="mb-4 text-lg font-semibold">Preparing Orders</h2>

      <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

export default OrdersPreparing;
