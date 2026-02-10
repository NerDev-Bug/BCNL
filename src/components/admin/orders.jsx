// Orders.jsx
import { useState } from "react";
import History from "./orders/History"
import OrdersPending from "./orders/OrdersPending"
import OrdersPreparing from "./orders/OrdersPreparing"
import OrdersToDelivered from "./orders/OrdersToDelivered"
import OrdersDelivered from "./orders/OrdersDelivered"
import OrdersReturned from "./orders/OrdersReturned"

function OrdersPage() {
  const [activeTab, setActiveTab] = useState("history");

  const tabs = [
    { label: "Orders History", key: "history" },
    { label: "Paid", key: "paid" },
    { label: "Preparing", key: "preparing" },
    { label: "To Delivered", key: "toDelivered" },
    { label: "Delivered", key: "delivered" },
    { label: "Returned", key: "returned" },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "history":
        return <History />;
      case "paid":
        return <OrdersPending />;
      case "preparing":
        return <OrdersPreparing />;
      case "toDelivered":
        return <OrdersToDelivered />;
      case "delivered":
        return <OrdersDelivered />;
      case "returned":
        return <OrdersReturned />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Orders Management</h1>
            <p className="text-sm text-gray-500">Track and manage customer orders across all stages</p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    relative px-6 py-3 text-sm font-semibold transition-all duration-200
                    rounded-t-lg border-b-2 border-transparent
                    ${
                      isActive
                        ? "text-[#7B2220] border-[#7B2220] bg-[#7B2220]/5"
                        : "text-gray-600 hover:text-[#7B2220] hover:bg-gray-50"
                    }
                  `}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B2220] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4">{renderActiveTab()}</div>
      </div>
    </div>
  );
}

export default OrdersPage;
