// OrdersPreparing.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { createOrderToDeliveredNotification } from "../../../utils/notifications";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import ConfirmationModal from "../../common/ConfirmationModal";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";
import { ChevronDown } from "lucide-react";

function OrdersPreparing() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'accept' or 'delete'
    order: null,
  });

  useEffect(() => {
    const fetchPreparingOrders = async () => {
      try {
        const q = query(collection(db, "orders"), where("paymentStatus", "==", "preparing"));
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
        // console.log("Preparing Orders data:", data);
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders.");
        toast.error("Failed to load preparing orders. Please try again.");
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

  // Handle opening confirmation modal for accept
  const handleAcceptOrder = (order) => {
    setConfirmModal({ isOpen: true, type: "accept", order });
  };

  // Handle opening confirmation modal for delete
  const handleDeleteOrder = (order) => {
    setConfirmModal({ isOpen: true, type: "delete", order });
  };

  // Confirm accepting an order (preparing -> to_delivered)
  const confirmAcceptOrder = async () => {
    const order = confirmModal.order;
    if (!order) {
      setConfirmModal({ isOpen: false, type: null, order: null });
      return;
    }

    try {
      // Get full order data first
      const orderRef = doc(db, "orders", order.id);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        toast.error("Order not found");
        setConfirmModal({ isOpen: false, type: null, order: null });
        return;
      }

      const orderData = { id: orderSnap.id, ...orderSnap.data() };

      await updateDoc(orderRef, {
        paymentStatus: "to_delivered",
      });

      // Send notification to customer
      try {
        await createOrderToDeliveredNotification(orderData);
      } catch (notifError) {
        console.error("Error creating order to delivered notification:", notifError);
      }

      // Remove the order from the list immediately
      setOrders(orders.filter(o => o.id !== order.id));
      toast.success("Order marked as delivered and customer notified!");
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Failed to update order status.");
    } finally {
      setConfirmModal({ isOpen: false, type: null, order: null });
    }
  };

  // Confirm deleting an order
  const confirmDeleteOrder = async () => {
    const order = confirmModal.order;
    if (!order) {
      setConfirmModal({ isOpen: false, type: null, order: null });
      return;
    }

    try {
      const orderDeleteRef = doc(db, "orders", order.id);
      await deleteDoc(orderDeleteRef);
      setOrders(orders.filter(o => o.id !== order.id));
      console.log("Delete order:", order.id);
      toast.success("Preparing order deleted successfully");
    } catch (err) {
      console.error("Error deleting order:", err);
      toast.error("Failed to delete order");
    } finally {
      setConfirmModal({ isOpen: false, type: null, order: null });
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
          onAccept={() => handleAcceptOrder(row)}
          onDelete={() => handleDeleteOrder(row)}
          acceptLabel="To Delivered"
        />
      ),
    },
  ];

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="pt-4 w-full min-w-0">
      <h2 className="mb-4 text-lg font-semibold text-left">Preparing Orders</h2>
      <div className="w-full min-w-0">
        <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* CONFIRMATION MODAL FOR ACCEPT */}
      {confirmModal.type === "accept" && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onConfirm={confirmAcceptOrder}
          onClose={() => setConfirmModal({ isOpen: false, type: null, order: null })}
          title="Mark as To Delivered"
          message={`Are you sure you want to mark order #${confirmModal.order?.id.slice(0, 6)} as to delivered? The customer will be notified.`}
          confirmText="Mark as To Delivered"
          cancelText="Cancel"
          confirmButtonColor="bg-green-600"
        />
      )}

      {/* CONFIRMATION MODAL FOR DELETE */}
      {confirmModal.type === "delete" && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onConfirm={confirmDeleteOrder}
          onClose={() => setConfirmModal({ isOpen: false, type: null, order: null })}
          title="Delete Order"
          message={`Are you sure you want to delete order #${confirmModal.order?.id.slice(0, 6)}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600"
        />
      )}
    </div>
  );
}

export default OrdersPreparing;
