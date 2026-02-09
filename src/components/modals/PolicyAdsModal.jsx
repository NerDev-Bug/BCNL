import { useEffect, useState } from "react";

function PolicyAdsModal({ onClose }) {
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
  }, []);

  const handleClose = () => {
    setVisible(false);

    // Wait for fade-out animation before unmount
    setTimeout(() => {
      onClose();
    }, 300); // must match duration below
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
      transition-opacity duration-300
      ${visible ? "opacity-100" : "opacity-0"}
      bg-black/60`}
    >
      <div
        className={`bg-white rounded-lg p-6 max-w-md w-full text-center
        transform transition-all duration-300
        ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <h2 className="text-xl font-bold mb-3 font-cooper text-[#502455]">
          Policy
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Please be advised that any changes, cancellations, or special requests related to your order must be made at least five (5) days before the scheduled delivery date, as orders that are already within this preparation period may have begun processing, sourcing of ingredients, or production, and therefore we cannot guarantee modifications, refunds, or adjustments once the order is within five days of delivery.
        </p>

        <button
          onClick={handleClose}
          className="w-full bg-[#7B2220] text-white py-2 rounded-md hover:bg-[#502455] transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default PolicyAdsModal;
