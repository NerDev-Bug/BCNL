import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import { toast } from "react-toastify";
import Pagination from "../../common/Pagination";

function OrdersReturned() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        const fetchReturnOrders = async () => {
        try {
            // Fetch both return_requested (pending) and returned (approved) orders
            const q = query(
            collection(db, "orders"),
            where("paymentStatus", "in", ["return_requested", "returned"])
            );

            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            }))
            .sort((a, b) => {
              // Sort by returnRequestedAt or createdAt: newest first
              const getTime = (timestamp) => {
                if (!timestamp) return 0
                if (timestamp?.seconds) return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
                if (timestamp instanceof Date) return timestamp.getTime()
                return new Date(timestamp).getTime() || 0
              }
              const aTime = getTime(a.returnRequestedAt || a.createdAt)
              const bTime = getTime(b.returnRequestedAt || b.createdAt)
              return bTime - aTime // Newest first
            });
            setOrders(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load orders.");
        } finally {
            setLoading(false);
        }
        };

        fetchReturnOrders();
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

    // Handle approving a return request
    const handleApproveReturn = async (orderId) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                paymentStatus: "returned",
                returnApprovedAt: new Date(),
            });
            
            setOrders(orders.map(order => 
                order.id === orderId 
                    ? { ...order, paymentStatus: "returned" }
                    : order
            ));
            toast.success("Return request approved successfully");
        } catch (err) {
            console.error("Error approving return:", err);
            toast.error("Failed to approve return request");
        }
    };

    // Handle rejecting a return request (revert to delivered)
    const handleRejectReturn = async (orderId) => {
        const confirmed = window.confirm("Are you sure you want to reject this return request? The order will be reverted to 'delivered' status.");
        if (!confirmed) return;

        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                paymentStatus: "delivered",
                returnRejectedAt: new Date(),
            });
            
            setOrders(orders.filter(order => order.id !== orderId));
            toast.success("Return request rejected. Order reverted to delivered status.");
        } catch (err) {
            console.error("Error rejecting return:", err);
            toast.error("Failed to reject return request");
        }
    };

    // Handle deleting an order
    const handleDeleteOrder = async orderId => {
        const confirmed = window.confirm("Are you sure you want to delete this order?");
        if (!confirmed) return;

        try {
            const orderDeleteRef = doc(db, "orders", orderId);
            await deleteDoc(orderDeleteRef);
            setOrders(orders.filter(order => order.id !== orderId));
            toast.success("Order deleted successfully");
        } catch (err) {
            console.error("Error deleting order:", err);
            toast.error("Failed to delete order");
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
                            onClick={() => handleApproveReturn(row.id)}
                            className="px-3 py-1 text-[11px] font-medium text-white bg-green-600 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 w-full justify-center inline-flex items-center gap-1"
                        >
                            ✓ Approve
                        </button>
                        <button
                            onClick={() => handleRejectReturn(row.id)}
                            className="px-3 py-1 text-[11px] font-medium text-white bg-orange-600 rounded-full hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 w-full justify-center inline-flex items-center gap-1"
                        >
                            ✗ Reject
                        </button>
                        <RowActions 
                            onDelete={() => handleDeleteOrder(row.id)}
                        />
                    </div>
                );
            }
            // For already approved returns, just show delete
            return (
                <RowActions 
                    onDelete={() => handleDeleteOrder(row.id)}
                />
            );
        },
        },
    ];

    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="pt-4">
            <h2 className="mb-4 text-lg font-semibold">
                Returned Orders & Return Requests
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
export default OrdersReturned;