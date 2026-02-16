// Orders.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import History from "./orders/History"
import OrdersPending from "./orders/OrdersPending"
import OrdersPreparing from "./orders/OrdersPreparing"
import OrdersToDelivered from "./orders/OrdersToDelivered"
import OrdersDelivered from "./orders/OrdersDelivered"
import OrdersReturned from "./orders/OrdersReturned"

function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  
  // Set initial tab from URL or default to "history"
  const [activeTab, setActiveTab] = useState(tabFromUrl || "history");

  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-2 md:p-3 lg:p-4">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Orders Management</h1>
            <p className="text-xs sm:text-sm text-gray-500">Track and manage customer orders across all stages</p>
          </div>

          {/* Tabs: horizontal scroll on mobile */}
          <div className="overflow-x-auto -mx-px scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex gap-1 border-b border-gray-200 pb-1 min-w-max sm:min-w-0 sm:flex-wrap">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setSearchParams({ tab: tab.key });
                    }}
                    className={`
                      relative px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 text-xs sm:text-sm font-semibold transition-all duration-200
                      rounded-t-lg border-b-2 border-transparent whitespace-nowrap flex-shrink-0
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
        </div>

        {/* Tab Content */}
        <div className="mt-3 sm:mt-4 w-full min-w-0">{renderActiveTab()}</div>
      </div>
    </div>
  );
}

export default OrdersPage;
