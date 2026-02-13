// OrdersPreparing.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import ConfirmationModal from "../../common/ConfirmationModal";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";

function OrdersDelivered() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      order: null,
    });

    useEffect(() => {
    const fetchPreparingOrders = async () => {
        try {
        const q = query(
            collection(db, "orders"),
            where("paymentStatus", "==", "delivered")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }))
        .sort((a, b) => {
          // Sort by createdAt: oldest first (ascending)
          const getTime = (timestamp) => {
            if (!timestamp) return 0
            if (timestamp?.seconds) return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
            if (timestamp instanceof Date) return timestamp.getTime()
            return new Date(timestamp).getTime() || 0
          }
          return getTime(a.createdAt) - getTime(b.createdAt)
        });
        // console.log("Delivered Orders data:", data);
        setOrders(data);
        } catch (err) {
        console.error(err);
        setError("Failed to load orders.");
        toast.error("Failed to load delivered orders. Please try again.");
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

    // Handle opening confirmation modal for delete
    const handleDeleteOrder = (order) => {
      setConfirmModal({ isOpen: true, order });
    };

    // Confirm deleting an order
    const confirmDeleteOrder = async () => {
      const order = confirmModal.order;
      if (!order) {
        setConfirmModal({ isOpen: false, order: null });
        return;
      }

      try {
        const orderDeleteRef = doc(db, "orders", order.id);
        await deleteDoc(orderDeleteRef);
        setOrders(orders.filter(o => o.id !== order.id));
        console.log("Delete order:", order.id);
        toast.success("Order deleted successfully");
      } catch (err) {
        console.error("Error deleting order:", err);
        toast.error("Failed to delete order");
      } finally {
        setConfirmModal({ isOpen: false, order: null });
      }
    };

    // Compute paginated orders
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
        render: row => <StatusBadge value={row.paymentMethod} />,
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
        render: row => <StatusBadge value={row.paymentStatus} />,
    },
    {
        key: "actions",
        header: "Action",
        render: row => (
        <RowActions 
            onDelete={() => handleDeleteOrder(row)}
            // No "Accept" button because it's already delivered
        />
        ),
    },
    ];

    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="pt-4">
            <h2 className="mb-4 text-lg font-semibold">
            Delivered Orders
            </h2>

            <DataTable columns={columns} data={paginatedOrders} loading={loading} />
            <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            />

            {/* CONFIRMATION MODAL FOR DELETE */}
            <ConfirmationModal
              isOpen={confirmModal.isOpen}
              onConfirm={confirmDeleteOrder}
              onClose={() => setConfirmModal({ isOpen: false, order: null })}
              title="Delete Order"
              message={`Are you sure you want to delete order #${confirmModal.order?.id.slice(0, 6)}? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              confirmButtonColor="bg-red-600"
            />
        </div>
    );
}
export default OrdersDelivered;