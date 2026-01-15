function OrderPreparing() {
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
            d="M12 8v4l3 3"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* TEXT */}
      <h2 className="text-lg font-semibold text-gray-700">
        No Orders Being Prepared
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        You don’t have any orders in preparation right now.
      </p>
    </div>
  )
}

export default OrderPreparing
