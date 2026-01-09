import { useState, useEffect } from "react";

function Cart({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem }) {
  const [quantities, setQuantities] = useState({});

  // Sync quantities whenever cartItems change
  useEffect(() => {
    const newQuantities = {};
    cartItems.forEach((item) => {
      newQuantities[item.id] = quantities[item.id] ?? item.quantity;
    });
    setQuantities(newQuantities);
  }, [cartItems]);

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * (quantities[item.id] || 0),
    0
  );

  const handleQuantityChange = (id, value) => {
    if (value < 1) return;
    setQuantities((prev) => ({ ...prev, [id]: value }));
    if (onUpdateQuantity) onUpdateQuantity(id, value);
  };

  const handleRemove = (id) => {
    if (onRemoveItem) onRemoveItem(id);
  };

  return (
    <>
      {/* OVERLAY */}
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />}

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-white z-50 transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-[#7B2220]">Shopping cart</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-black">
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70%] text-center">
            <p className="text-[#7B2220] mb-6">Your cart is empty.</p>
            <button
              onClick={onClose}
              className="bg-[#7B2220] text-white px-6 py-3 rounded-md hover:opacity-90"
            >
              Return to Shop
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="overflow-y-auto h-[calc(100%-80px)] p-5 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[#502455]">{item.name}</p>
                    <p className="text-gray-600">
                      ₱{item.price} x{" "}
                      <input
                        type="number"
                        min={1}
                        value={quantities[item.id] || 1}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value))
                        }
                        className="w-14 text-center border rounded-md px-1 py-0.5"
                      />
                    </p>
                  </div>

                  {/* Price + Remove Button */}
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#7B2220]">
                      ₱{item.price * (quantities[item.id] || 1)}
                    </p>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-600 hover:text-red-800 font-semibold px-2 py-1 border border-red-300 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total + Checkout Button */}
            <div className="fixed bottom-0 right-0 w-[380px] bg-white border-t p-5 flex items-center justify-between shadow-lg z-50">
              <p className="font-semibold text-lg text-[#502455]">
                Total: ₱{totalPrice}
              </p>

              <button
                onClick={() => alert("Checkout clicked")}
                className="bg-[#7B2220] text-white px-3 py-1.5 rounded-md hover:bg-[#502455] transition text-sm"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Cart;
