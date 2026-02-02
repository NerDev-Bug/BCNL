import { useEffect, useState } from "react"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "../../firebase"

export default function UserOrderHistory({ user }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        )

        const snap = await getDocs(q)
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setOrders(data)
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  if (loading) return <p>Loading orders...</p>

  if (orders.length === 0) {
    return <p className="text-gray-500">No orders found.</p>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Order History</h2>

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-lg p-4 shadow-sm bg-gray-50"
          >
            <p>
              <span className="font-medium">Order ID:</span> {order.id}
            </p>
            <p>
              <span className="font-medium">Total:</span> ₱{order.total}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              {order.status || "Pending"}
            </p>
            <p className="text-sm text-gray-500">
              {order.createdAt?.toDate
                ? order.createdAt.toDate().toLocaleString()
                : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
