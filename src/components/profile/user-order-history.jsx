import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebase"
import { StatusBadge } from "../common/StatusBadge"

export default function UserOrderHistory({ user }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchOrders = async () => {
      try {
        setLoading(true)
        // ✅ Fetch only delivered and returned orders
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          where("paymentStatus", "in", ["delivered", "returned"])
        )

        const snap = await getDocs(q)
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Sort by createdAt descending (newest first)
        data.sort((a, b) => {
          const getTime = (timestamp) => {
            if (!timestamp) return 0
            if (timestamp?.seconds) return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
            if (timestamp instanceof Date) return timestamp.getTime()
            return new Date(timestamp).getTime() || 0
          }
          return getTime(b.createdAt) - getTime(a.createdAt)
        })

        setOrders(data)
      } catch (err) {
        console.error("Error fetching orders:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const formatDate = (timestamp) => {
    if (!timestamp) return "—"
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border rounded-lg p-4 shadow-sm bg-gray-50 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        <div className="border rounded-lg p-8 text-center bg-gray-50">
          <p className="text-gray-500 mb-2">No delivered or returned orders found.</p>
          <p className="text-sm text-gray-400">
            Your completed orders will appear here once they are delivered or returned.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Order History</h2>
      <p className="text-sm text-gray-500 mb-4">
        Showing {orders.length} order{orders.length !== 1 ? "s" : ""} (delivered and returned)
      </p>

      <div className="space-y-3">
        {orders.map((order) => {
          const isReturned = order.paymentStatus === "returned"
          const isDelivered = order.paymentStatus === "delivered"

          return (
            <div
              key={order.id}
              className={`border rounded-lg p-4 shadow-sm transition-all hover:shadow-md ${
                isReturned
                  ? "bg-red-50 border-red-200"
                  : isDelivered
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <StatusBadge value={order.paymentStatus} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="font-semibold text-gray-900">
                    €{Number(order.total || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                  <p className="text-sm text-gray-700">
                    {order.orderData?.paymentMethod || order.paymentMethod || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Items</p>
                  <p className="text-sm text-gray-700">
                    {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {order.orderData?.receiverName && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Recipient</p>
                    <p className="text-sm text-gray-700">
                      {order.orderData.receiverName}
                    </p>
                  </div>
                )}
              </div>

              {order.returnReason && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Return Reason</p>
                  <p className="text-sm text-gray-700">{order.returnReason}</p>
                  {order.returnRequestedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Requested: {formatDate(order.returnRequestedAt)}
                    </p>
                  )}
                </div>
              )}

              {order.items && order.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Order Items</p>
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        • {item.name} × {item.quantity}
                        {item.price && (
                          <span className="text-gray-500 ml-2">
                            (€{Number(item.price * item.quantity).toFixed(2)})
                          </span>
                        )}
                      </p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-gray-400">
                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
