import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

function PolicyAdsModal({ onClose }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [policyData, setPolicyData] = useState({
    title: "Policy",
    content:
      "Please be advised that any changes, cancellations, or special requests related to your order must be made at least five (5) days before the scheduled delivery date, as orders that are already within this preparation period may have begun processing, sourcing of ingredients, or production, and therefore we cannot guarantee modifications, refunds, or adjustments once the order is within five days of delivery.",
  });

  // ✅ Fetch policy content from Firestore
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const snap = await getDoc(doc(db, "pages", "policyAds"));
        if (snap.exists()) {
          const data = snap.data();
          setPolicyData((prev) => ({
            title: data.title || prev.title,
            content: data.content || prev.content,
          }));
        }
      } catch (err) {
        console.error("Error fetching policy content:", err);
        // Use default values if fetch fails
      } finally {
        setLoading(false);
        // Fade in after content is loaded
        setTimeout(() => {
          setVisible(true);
        }, 50);
      }
    };

    fetchPolicy();
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
        className={`bg-white rounded-lg p-6 max-w-lg w-full text-center
        transform transition-all duration-300
        ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {loading ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7B2220] mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-3 font-cooper text-[#502455]">
              {policyData.title}
            </h2>

            <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
              {policyData.content}
            </p>

            <button
              onClick={handleClose}
              className="w-full bg-[#7B2220] text-white py-2 rounded-md hover:bg-[#502455] transition"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PolicyAdsModal;
