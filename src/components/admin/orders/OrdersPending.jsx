import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; // adjust path to your firebase config

function OrdersPending() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);

        const pendingOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(pendingOrders);
      } catch (err) {
        console.error("Error fetching pending orders:", err);
        setError("Failed to load pending orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  if (loading) return <div>Loading pending orders...</div>;
  if (error) return <div>{error}</div>;
  if (orders.length === 0) return <div>No pending orders found.</div>;

  const formatDate = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", { timeZoneName: "short" });
  };

  return (
    <div>
      <h2>Pending Orders</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Order ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Customer</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Contact Number</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Address</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>City</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Country</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Postal Code</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Items</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Total Price</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Payment Method</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Created At</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.receiverName || "N/A"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.email || order.userEmail || "N/A"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.contactNumber || "N/A"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {`${order.houseNumber || ""} ${order.streetName || ""}`.trim() || "N/A"}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.city || "N/A"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.country || "N/A"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.postalCode || "N/A"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {order.items?.map(item => (
                  <div key={item.id || item.cartItemId}>
                    {item.name} x{item.quantity} (${item.price})
                  </div>
                ))}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>${order.totalPrice || 0}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.paymentMethod || "N/A"}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {order.createdAt ? formatDate(order.createdAt) : "N/A"}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrdersPending;
