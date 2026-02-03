/* eslint-disable react-hooks/static-components */
import { useState } from "react"

import OrderHistory from "../components/order/OrderHistory"
import OrderPreparing from "../components/order/OrderPreparing"
import OrderToDeliver from "../components/order/OrderToDeliver"
import OrderDelivered from "../components/order/OrderDelivered"
import OrderReturn from "../components/order/OrderReturn"

const TABS = ["All", "Preparing", "To Deliver", "Delivered", "Returns"]

const TAB_COMPONENTS = {
  All: OrderHistory,
  Preparing: OrderPreparing,
  "To Deliver": OrderToDeliver,
  Delivered: OrderDelivered,
  Returns: OrderReturn,
}

const TAB_REMINDERS = {
  All: {
    title: "Order Policy",
    text: (
      <>
        Please review your orders carefully. Delivered orders are considered
        final after <b>7 days</b>. Returns and disputes must be reported within
        this period.
      </>
    ),
  },
  Preparing: {
    title: "Order Preparing",
    text: (
      <>
        Your order is currently being prepared. Changes or cancellations are
        only allowed before the order is marked as <b>To Deliver</b>.
      </>
    ),
  },
  "To Deliver": {
    title: "Out for Delivery",
    text: (
      <>
        Please ensure someone is available to receive your order. Failed
        delivery attempts may result in rescheduling or additional charges.
      </>
    ),
  },
  Delivered: {
    title: "Delivered Orders",
    text: (
      <>
        Once marked as <b>Delivered</b>, you have <b>7 days</b> to report any
        issues. After this period, orders are considered accepted.
      </>
    ),
  },
  Returns: {
    title: "Returns Policy",
    text: (
      <>
        Returned items are subject to inspection. Refunds or replacements will
        only be processed after approval based on our return policy.
      </>
    ),
  },
}

function Order() {
  const [activeTab, setActiveTab] = useState("All")

  const OrderPolicyReminder = ({ tab }) => {
  const reminder = TAB_REMINDERS[tab]
    if (!reminder) return null

    return (
      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left">
        <p className="text-sm font-medium text-yellow-800">
          {reminder.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-yellow-700">
          {reminder.text}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* TITLE */}
        <h1 className="text-2xl font-bold text-[#502455] mb-6">
          My Orders
        </h1>

        {/* TABS */}
        <div className="border-b bg-white sticky top-[72px] z-20">
          <div className="flex justify-center gap-4 md:gap-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative py-4 text-sm font-semibold
                  ${activeTab === tab ? "text-[#7B2220]" : "text-gray-500"}
                `}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#7B2220]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-6 bg-white rounded-lg border p-6 text-center min-h-[400px]">
          {(() => {
            const ActiveComponent = TAB_COMPONENTS[activeTab]
            return ActiveComponent ? <ActiveComponent /> : null
          })()}

          <OrderPolicyReminder tab={activeTab} />
        </div>
      </div>
    </div>
  )
}

export default Order
