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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Orders Page</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded transition ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">{renderActiveTab()}</div>
    </div>
  );
}

export default OrdersPage;
