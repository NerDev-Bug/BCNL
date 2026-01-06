function Cart({ isOpen, onClose }) {
  return (
    <>
      {/* OVERLAY */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-white z-50 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-[#7B2220]">
            Shopping cart
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-black"
          >
            ×
          </button>
        </div>

        {/* EMPTY STATE */}
        <div className="flex flex-col items-center justify-center h-[70%] text-center">
          <p className="text-[#7B2220] mb-6">
            Your cart is empty.
          </p>

          <button
            onClick={onClose}
            className="bg-[#7B2220] text-white px-6 py-3 rounded-md hover:opacity-90"
          >
            Return to Shop
          </button>
        </div>
      </div>
    </>
  )
}

export default Cart
