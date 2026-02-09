import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import Pagination from "../../common/Pagination";
import { toast } from "react-toastify";
import { ChevronDown } from "lucide-react";

function OrdersPending() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);


  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("paymentStatus", "==", "paid")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Pending Orders data:", data);
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

  // Handle accepting an order (changing its status to 'preparing')
  const handleAcceptOrder = async orderId => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        paymentStatus: "preparing",
      });
      // Remove the order from the list immediately
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Failed to update order status.");
    }
  };

  // Handle deleting an order
  const handleDeleteOrder = async orderId => {
    try {
      const orderDeleteRef = doc(db, "orders", orderId);
      await deleteDoc(orderDeleteRef);
      setOrders(orders.filter(order => order.id !== orderId));
      // You can implement delete logic here if needed
      console.log("Delete order:", orderId);
      toast.success("Pending order deleted successfully");
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
      render: row => row.orderData?.receiverName || "—",
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
      render: row => `€${Number(row.total || 0).toFixed(2)}`,
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
      render: row => (
        <StatusBadge value={row.paymentStatus} />
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: row => (
        <RowActions 
          onAccept={() => handleAcceptOrder(row.id)}
          onDelete={() => handleDeleteOrder(row.id)}
          acceptLabel="Preparing"
        />
      ),
    },
  ];

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="pt-4">
      <h2 className="mb-4 text-lg font-semibold">
        Pending Orders
      </h2>

      <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />
    </div>
  );
}

export default OrdersPending;
