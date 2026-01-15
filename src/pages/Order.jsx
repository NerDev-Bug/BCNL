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

function Order() {
  const [activeTab, setActiveTab] = useState("All")

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
        </div>
      </div>
    </div>
  )
}

export default Order
