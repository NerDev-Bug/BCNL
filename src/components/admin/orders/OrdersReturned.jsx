import React, { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";
import ConfirmationModal from "../../common/ConfirmationModal";
import { createReturnApprovedNotification, createReturnRejectedNotification } from "../../../utils/notifications";

function OrdersReturned() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [copiedId, setCopiedId] = useState(null);
    
    // Confirmation modal states
    const [approveModal, setApproveModal] = useState({ isOpen: false, order: null });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, order: null, message: "" });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, order: null });
    const rejectMessageRef = useRef(null);

    // Real-time listener
    useEffect(() => {
        const q = query(
            collection(db, "orders"),
            where("paymentStatus", "in", ["return_requested", "returned"])
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs
                    .map((d) => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => {
                        const getTime = (ts) => {
                            if (!ts) return 0;
                            if (ts?.seconds) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6;
                            if (ts instanceof Date) return ts.getTime();
                            return new Date(ts).getTime() || 0;
                        };
                        return getTime(b.returnRequestedAt || b.createdAt) - getTime(a.returnRequestedAt || a.createdAt);
                    });
                setOrders(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("OrdersReturned listener error:", err);
                setError("Failed to load orders.");
                toast.error("Failed to load returned orders. Please try again.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

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

    const formatDateTime = timestamp => {
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

    // Handle opening confirmation modal for approve
    const handleApproveReturn = (order) => {
        setApproveModal({ isOpen: true, order });
    };

    // Confirm approving a return request
    const confirmApproveReturn = async () => {
        const order = approveModal.order;
        if (!order) {
            setApproveModal({ isOpen: false, order: null });
            return;
        }

        try {
            // Get full order data first
            const orderRef = doc(db, "orders", order.id);
            const orderSnap = await getDoc(orderRef);
            
            if (!orderSnap.exists()) {
                toast.error("Order not found");
                setApproveModal({ isOpen: false, order: null });
                return;
            }

            const orderData = { id: orderSnap.id, ...orderSnap.data() };

            await updateDoc(orderRef, {
                paymentStatus: "returned",
                returnApprovedAt: Timestamp.now(),
            });
            
            // Send notification to customer
            try {
                await createReturnApprovedNotification(orderData);
            } catch (notifError) {
                console.error("Error creating return approved notification:", notifError);
            }
            
            setOrders(orders.map(o => 
                o.id === order.id 
                    ? { ...o, paymentStatus: "returned" }
                    : o
            ));
            toast.success("Return request approved successfully");
        } catch (err) {
            console.error("Error approving return:", err);
            toast.error("Failed to approve return request");
        } finally {
            setApproveModal({ isOpen: false, order: null });
        }
    };

    // Open reject confirmation modal (with message textarea)
    const openRejectModal = (order) => {
        setRejectModal({ isOpen: true, order, message: "" });
    };

    // Auto-resize textarea to fit content
    const adjustRejectTextareaHeight = () => {
        const el = rejectMessageRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
    };

    useEffect(() => {
        if (rejectModal.isOpen && rejectModal.order) {
            // Reset and fit textarea when modal opens
            setTimeout(adjustRejectTextareaHeight, 0);
        }
    }, [rejectModal.isOpen, rejectModal.order]);

    // Confirm rejecting a return request (revert to delivered) with message
    const confirmRejectReturn = async () => {
        const order = rejectModal.order;
        const rejectionMessage = (rejectModal.message || "").trim();
        if (!order) {
            setRejectModal({ isOpen: false, order: null, message: "" });
            return;
        }

        try {
            // Get full order data first
            const orderRef = doc(db, "orders", order.id);
            const orderSnap = await getDoc(orderRef);
            
            if (!orderSnap.exists()) {
                toast.error("Order not found");
                setRejectModal({ isOpen: false, order: null, message: "" });
                return;
            }

            const orderData = { id: orderSnap.id, ...orderSnap.data() };

            await updateDoc(orderRef, {
                paymentStatus: "delivered",
                returnRejectedAt: Timestamp.now(),
                ...(rejectionMessage ? { returnRejectionReason: rejectionMessage } : {}),
            });
            
            // Send notification to customer (with optional rejection message)
            try {
                await createReturnRejectedNotification(orderData, rejectionMessage || undefined);
            } catch (notifError) {
                console.error("Error creating return rejected notification:", notifError);
            }
            
            setOrders(orders.filter(o => o.id !== order.id));
            toast.success("Return request rejected. Order reverted to delivered status.");
        } catch (err) {
            console.error("Error rejecting return:", err);
            toast.error("Failed to reject return request");
        } finally {
            setRejectModal({ isOpen: false, order: null, message: "" });
        }
    };

    const closeRejectModal = () => {
        setRejectModal({ isOpen: false, order: null, message: "" });
    };

    // Open delete confirmation modal
    const openDeleteModal = (order) => {
        setDeleteModal({ isOpen: true, order });
    };

    // Confirm deleting an order
    const confirmDeleteOrder = async () => {
        const order = deleteModal.order;
        if (!order) {
            setDeleteModal({ isOpen: false, order: null });
            return;
        }

        try {
            const orderDeleteRef = doc(db, "orders", order.id);
            await deleteDoc(orderDeleteRef);
            setOrders(orders.filter(o => o.id !== order.id));
            toast.success("Order deleted successfully");
        } catch (err) {
            console.error("Error deleting order:", err);
            toast.error("Failed to delete order");
        } finally {
            setDeleteModal({ isOpen: false, order: null });
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
        header: "Order Date",
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
        render: row => <StatusBadge value={row.paymentMethod || row.orderData?.paymentMethod} />,
        },
        {
        key: "totalPrice",
        header: "Total",
        render: row => `€${Number(row.total || 0).toFixed(2)}`,
        },
        {
        key: "returnReason",
        header: "Return Reason",
        render: row => (
            <div className="max-w-xs">
                <p className="text-sm text-gray-700 line-clamp-2" title={row.returnReason || "—"}>
                    {row.returnReason || "—"}
                </p>
                {row.returnRequestedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                        Requested: {formatDateTime(row.returnRequestedAt)}
                    </p>
                )}
            </div>
        ),
        },
        {
        key: "status",
        header: "Status",
        render: row => (
            <StatusBadge 
                value={row.paymentStatus === "return_requested" ? "Pending Approval" : row.paymentStatus} 
            />
        ),
        },
        {
        key: "actions",
        header: "Action",
        render: row => {
            // Show approve/reject buttons only for pending return requests
            if (row.paymentStatus === "return_requested") {
                return (
                    <div className="flex flex-col gap-1 min-w-[120px]">
                        <button
                            onClick={() => handleApproveReturn(row)}
                            className="px-3 py-1 text-[11px] font-medium text-white bg-green-600 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 w-full justify-center inline-flex items-center gap-1"
                        >
                            ✓ Approve
                        </button>
                        <button
                            onClick={() => openRejectModal(row)}
                            className="px-3 py-1 text-[11px] font-medium text-white bg-orange-600 rounded-full hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 w-full justify-center inline-flex items-center gap-1"
                        >
                            ✗ Reject
                        </button>
                        <RowActions 
                            onDelete={() => openDeleteModal(row)}
                        />
                    </div>
                );
            }
            // For already approved returns, just show delete
            return (
                <RowActions 
                    onDelete={() => openDeleteModal(row)}
                />
            );
        },
        },
    ];

    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="pt-4 w-full min-w-0">
            <h2 className="mb-4 text-lg font-semibold text-left">Returned Orders & Return Requests</h2>
            <div className="w-full min-w-0">
                <DataTable columns={columns} data={paginatedOrders} loading={loading} />
            </div>
            <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            />

            {/* Approve Confirmation Modal */}
            <ConfirmationModal
                isOpen={approveModal.isOpen}
                onClose={() => setApproveModal({ isOpen: false, order: null })}
                onConfirm={confirmApproveReturn}
                title="Approve Return Request"
                message={`Are you sure you want to approve the return request for order #${approveModal.order?.id.slice(0, 6)}? The customer will be notified.`}
                confirmText="Approve"
                cancelText="Cancel"
                confirmButtonColor="bg-green-600"
            />

            {/* Reject Modal with message textarea (auto-resize) */}
            {rejectModal.isOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={closeRejectModal} />
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                            <div className="px-6 py-5 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">Reject Return Request</h3>
                            </div>
                            <div className="px-6 py-5 space-y-3">
                                <p className="text-gray-600 text-sm">
                                    Rejecting the return for order <strong>#{rejectModal.order?.id?.slice(0, 6)}</strong>. The order will be reverted to &quot;delivered&quot; and the customer will be notified.
                                </p>
                                <label className="block text-sm font-medium text-gray-700">
                                    Reason for rejection <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    ref={rejectMessageRef}
                                    value={rejectModal.message}
                                    onChange={(e) => {
                                        setRejectModal(prev => ({ ...prev, message: e.target.value }));
                                        setTimeout(adjustRejectTextareaHeight, 0);
                                    }}
                                    onInput={adjustRejectTextareaHeight}
                                    placeholder="Enter the reason for rejecting this return request..."
                                    rows={3}
                                    className="w-full min-h-[80px] max-h-[280px] px-4 py-3 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none overflow-y-auto"
                                />
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeRejectModal}
                                    className="px-6 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmRejectReturn}
                                    className="px-6 py-2.5 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, order: null })}
                onConfirm={confirmDeleteOrder}
                title="Delete Order"
                message={`Are you sure you want to delete order #${deleteModal.order?.id.slice(0, 6)}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonColor="bg-red-600"
            />
        </div>
    );
}
export default OrdersReturned;