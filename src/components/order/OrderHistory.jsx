function OrderHistory() {
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
            d="M9 17v-2a4 4 0 014-4h2m4 0a2 2 0 00-2-2h-2a4 4 0 00-4-4H9a4 4 0 00-4 4v6a2 2 0 002 2h2"
          />
        </svg>
      </div>

      {/* TEXT */}
      <h2 className="text-lg font-semibold text-gray-700">
        No Orders Found
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        You haven’t placed any orders yet.
      </p>
    </div>
  )
}

export default OrderHistory
