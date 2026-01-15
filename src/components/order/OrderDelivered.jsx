function OrderDelivered() {
  return (
    <div className="bg-white border rounded-lg py-16 flex flex-col items-center justify-center text-center">
      {/* ICON */}
      <div className="w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-gray-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* TEXT */}
      <h2 className="text-lg font-semibold text-gray-700">
        No Delivered Orders
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        You don’t have any orders that have been delivered yet.
      </p>
    </div>
  );
}

export default OrderDelivered;
