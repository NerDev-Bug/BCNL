// OrdersPreparing.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

import DataTable from "../../common/DataTable";
import { StatusBadge } from "../../common/StatusBadge";
import { RowActions } from "../../common/RowActions";
import Pagination from "../../common/Pagination";

function OrdersDelivered() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
    const fetchPreparingOrders = async () => {
        try {
        const q = query(
            collection(db, "orders"),
            where("status", "==", "delivered")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        console.log("Preparing Orders data:", data);
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

    const handleDeleteOrder = async orderId => {
    try {
        // Implement delete logic if needed
        console.log("Delete order:", orderId);
    } catch (err) {
        console.error("Error deleting order:", err);
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
        render: row => row.customer?.receiverName || "—",
    },
    {
        key: "paymentMethod",
        header: "Payment",
        render: row => <StatusBadge value={row.customer?.paymentMethod} />,
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
        render: row => <StatusBadge value={row.status} />,
    },
    {
        key: "actions",
        header: "Action",
        render: row => (
        <RowActions 
            onDelete={() => handleDeleteOrder(row.id)}
            // No "Accept" button because it's already preparing
        />
        ),
    },
    ];

    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="pt-4">
            <h2 className="mb-4 text-lg font-semibold">
            Preparing Orders
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
export default OrdersDelivered;