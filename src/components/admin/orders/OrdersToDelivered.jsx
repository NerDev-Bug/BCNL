import React, { useEffect, useState } from "react";
import {
  collection, query, where, onSnapshot,
  updateDoc, deleteDoc, doc, getDoc, Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { createDeliveryNotifications } from "../../../utils/notifications";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import ConfirmationModal from "../../common/ConfirmationModal";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";
import { ChevronDown, LocateIcon } from "lucide-react";
import LocationGMap from "../../common/LocationGMap";

// Open Map Route Location
// function getAdminLocation() {
//   const lat = import.meta.env.VITE_ADMIN_LAT;
//   const lng = import.meta.env.VITE_ADMIN_LNG;
//   if (lat == null || lng == null) return null;
//   const parsedLat = parseFloat(lat);
//   const parsedLng = parseFloat(lng);
//   if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) return null;
//   return { lat: parsedLat, lng: parsedLng };
// }

function OrdersToDelivered() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [copiedId, setCopiedId] = useState(null);

  // const [isMapOpen, setIsMapOpen] = useState(false);
  // const [selectedOrder, setSelectedOrder] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    order: null,
  });

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, "orders"), where("paymentStatus", "==", "to_delivered"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const t = (ts) => {
              if (!ts) return 0;
              if (ts?.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
              if (ts instanceof Date) return ts.getTime();
              return new Date(ts).getTime() || 0;
            };
            return t(a.createdAt) - t(b.createdAt);
          });
        setOrders(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("OrdersToDelivered listener error:", err);
        setError("Failed to load orders.");
        toast.error("Failed to load orders to deliver. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleAcceptOrder = (order) => {
    setConfirmModal({ isOpen: true, type: "accept", order });
  };

  const handleDeleteOrder = (order) => {
    setConfirmModal({ isOpen: true, type: "delete", order });
  };

  // Open Map Route Location
  // const openMap = (order) => {
  //   setSelectedOrder(order);
  //   setIsMapOpen(true);
  // };

  const confirmAcceptOrder = async () => {
    const order = confirmModal.order;
    if (!order) { setConfirmModal({ isOpen: false, type: null, order: null }); return; }

    try {
      const orderRef = doc(db, "orders", order.id);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        toast.error("Order not found.");
        setConfirmModal({ isOpen: false, type: null, order: null });
        return;
      }

      const orderData = { id: orderSnap.id, ...orderSnap.data() };

      await updateDoc(orderRef, {
        paymentStatus: "delivered",
        deliveredAt: Timestamp.now(),
      });

      if (orderData.userId && orderData.items?.length > 0) {
        try {
          await createDeliveryNotifications(orderData);
        } catch (notifErr) {
          console.error("Delivery notification error:", notifErr);
          toast.error(`Order delivered but notification failed: ${notifErr.message}`);
        }
      }

      toast.success("Order marked as delivered and customer notified!");
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Failed to update order status.");
    } finally {
      setConfirmModal({ isOpen: false, type: null, order: null });
    }
  };

  const confirmDeleteOrder = async () => {
    const order = confirmModal.order;
    if (!order) { setConfirmModal({ isOpen: false, type: null, order: null }); return; }

    try {
      await deleteDoc(doc(db, "orders", order.id));
      toast.success("Order deleted successfully");
    } catch (err) {
      console.error("Error deleting order:", err);
      toast.error("Failed to delete order");
    } finally {
      setConfirmModal({ isOpen: false, type: null, order: null });
    }
  };

  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      key: "expand-items",
      render: (row, { isOpen, toggle }) => (
        <button onClick={toggle} className="flex items-center justify-center w-full" aria-expanded={isOpen}>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      ),
    },
    {
      key: "id",
      header: "Order",
      render: (row) => (
        <button
          onClick={() => handleCopyId(row.id)}
          title={`Copy full ID: ${row.id}`}
          className="font-mono text-xs hover:text-[#7B2220] transition-colors"
        >
          {copiedId === row.id ? "✓ Copied" : `#${row.id.slice(0, 6)}`}
        </button>
      ),
    },
    {
      key: "createdAt",
      header: "Date / Time",
      render: (row) => (
        <div>
          <p className="text-xs">{formatDate(row.createdAt)}</p>
          <p className="text-[0.65rem] text-gray-400">{formatTime(row.createdAt)}</p>
        </div>
      ),
    },
    { key: "receiverName", header: "Customer", render: (row) => row.orderData?.receiverName || "—" },
    { key: "contactnumber", header: "Contact", render: (row) => row.orderData?.contactNumber || "—" },
    { key: "paymentMethod", header: "Payment", render: (row) => <StatusBadge value={row.paymentMethod} /> },
    { key: "totalPrice", header: "Total", render: (row) => `€${Number(row.total || 0).toFixed(2)}` },
    { key: "method", header: "Delivery", render: (row) => row.orderData?.method ?? "N/A" },
    {
      key: "delivery",
      header: "Address",
      render: (row) => {
        const c = row.orderData;
        if (!c) return "N/A";
        return `${c.streetName || ""}, ${c.postalCode || ""} ${c.city || ""}, ${c.country || ""}`.trim();
      },
    },
    { key: "items", header: "Items", render: (row) => `${row.items?.length || 0} items` },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.paymentStatus} /> },
    {
      key: "actions",
      header: "Action",
      render: (row) => {
        // Open Map Route Location
        // const hasLocation =
        //   row.orderData?.location ||
        //   row.orderData?.streetName ||
        //   row.orderData?.city;

        return (
          <div className="flex items-center gap-3">

            {/* Open Map Route Location */}
            {/* <LocateIcon
              size={18}
              title="View delivery location"
              className={
                hasLocation
                  ? "cursor-pointer text-blue-600 hover:text-blue-800"
                  : "text-gray-300 cursor-not-allowed"
              }
              onClick={() => hasLocation && openMap(row)}
            /> */}

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
    <div className="pt-4 w-full min-w-0">
      <h2 className="mb-4 text-lg font-semibold text-left">To Deliver</h2>
      <div className="w-full min-w-0">
        <DataTable columns={columns} data={paginatedOrders} loading={loading} />
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Open Map Route Location */}
      {/* <LocationGMap
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
      /> */}

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
