import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { createDeliveryNotifications } from "../../../utils/notifications";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import ConfirmationModal from "../../common/ConfirmationModal";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";

import { LocateIcon } from "lucide-react";
import LocationGMap from "../../common/LocationGMap";

function getAdminLocation() {
  const lat = import.meta.env.VITE_ADMIN_LAT;
  const lng = import.meta.env.VITE_ADMIN_LNG;
  if (lat == null || lng == null) return null;
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) return null;
  return { lat: parsedLat, lng: parsedLng };
}

function OrdersToDelivered() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'accept' or 'delete'
    order: null,
  });

  useEffect(() => {
    const fetchPreparingOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("paymentStatus", "==", "to_delivered")
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
        // console.log("To Delivered Orders data:", data);
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders.");
        toast.error("Failed to load orders to deliver. Please try again.");
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

  // Confirm accepting an order (changing its status to 'delivered')
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
        toast.error("Order not found.");
        setConfirmModal({ isOpen: false, type: null, order: null });
        return;
      }

      const orderData = { id: orderSnap.id, ...orderSnap.data() };

      // Update order status
      await updateDoc(orderRef, {
        paymentStatus: "delivered",
        deliveredAt: Timestamp.now(),
      });

      // Create delivery notifications for each product in the order
      if (orderData.userId && orderData.items && orderData.items.length > 0) {
        console.log("🔔 Attempting to create notifications for order:", orderData.id);
        console.log("📋 Order data:", {
          userId: orderData.userId,
          itemsCount: orderData.items.length,
          items: orderData.items
        });
        
        try {
          await createDeliveryNotifications(orderData);
          console.log("✅ Notifications created successfully");
        } catch (notifError) {
          console.error("❌ Error creating notifications:", notifError);
          console.error("Error details:", {
            message: notifError.message,
            code: notifError.code,
            stack: notifError.stack
          });
          toast.error(`Order delivered but notification failed: ${notifError.message}`);
          // Don't fail the whole operation if notifications fail
        }
      } else {
        console.warn("⚠️ Cannot create notifications - missing data:", {
          hasUserId: !!orderData.userId,
          hasItems: !!orderData.items,
          itemsLength: orderData.items?.length
        });
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
      toast.success("Order deleted successfully");
    } catch (err) {
      console.error("Error deleting order:", err);
      toast.error("Failed to delete order");
    } finally {
      setConfirmModal({ isOpen: false, type: null, order: null });
    }
  };

  const openMap = order => {
    setSelectedOrder(order);
    setIsMapOpen(true);
  };

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
      render: row => {
        const hasLocation =
          row.orderData?.location ||
          row.orderData?.streetName ||
          row.orderData?.city;

        return (
          <div className="flex items-center gap-3">
            <LocateIcon
              size={18}
              title="View delivery location"
              className={
                hasLocation
                  ? "cursor-pointer text-blue-600 hover:text-blue-800"
                  : "text-gray-300 cursor-not-allowed"
              }
              onClick={() => hasLocation && openMap(row)}
            />

            <RowActions
              onAccept={() => handleAcceptOrder(row)}
              onDelete={() => handleDeleteOrder(row)}
              acceptLabel="Delivered"
            />
          </div>
        );
      },
    },
  ];

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="pt-4">
      <h2 className="mb-4 text-lg font-semibold">Preparing Orders</h2>

      <DataTable
        columns={columns}
        data={paginatedOrders}
        loading={loading}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <LocationGMap
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        address={
          selectedOrder
            ? `${selectedOrder.orderData?.streetName || ""}, ${selectedOrder.orderData?.postalCode || ""} ${selectedOrder.orderData?.city || ""}, ${selectedOrder.orderData?.country || ""}`
            : ""
        }
        location={selectedOrder?.orderData?.location}
        adminLocation={getAdminLocation()}
        adminLabel={import.meta.env.VITE_ADMIN_NAME || "BCNL"}
        customerLabel={selectedOrder?.orderData?.receiverName || "Customer"}
      />

      {/* CONFIRMATION MODAL FOR ACCEPT */}
      {confirmModal.type === "accept" && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onConfirm={confirmAcceptOrder}
          onClose={() => setConfirmModal({ isOpen: false, type: null, order: null })}
          title="Mark as Delivered"
          message={`Are you sure you want to mark order #${confirmModal.order?.id.slice(0, 6)} as delivered? The customer will be notified.`}
          confirmText="Mark as Delivered"
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

export default OrdersToDelivered;
