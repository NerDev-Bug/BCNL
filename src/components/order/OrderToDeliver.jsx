function OrderToDeliver() {
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
            d="M3 3h18v4H3V3zM3 9h18v12H3V9z"
          />
        </svg>
      </div>

      {/* TEXT */}
      <h2 className="text-lg font-semibold text-gray-700">
        No Orders To Deliver
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        You don’t have any orders ready for delivery right now.
      </p>
    </div>
  );
}

export default OrderToDeliver;
