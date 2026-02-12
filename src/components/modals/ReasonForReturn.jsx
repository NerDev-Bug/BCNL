import React, { useState, useRef } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";

function ReasonForReturn({ order, onClose }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    setReason(e.target.value);

    // ✅ Auto resize
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto"; // reset first
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      const updatedOrder = {
        paymentStatus: "return_requested",
        returnReason: reason.trim(),
        returnRequestedAt: Timestamp.now(),
      };
      await updateDoc(orderRef, updatedOrder);

      // ✅ Note: Admin notification will be created automatically by the admin-side listener
      // when it detects the order status change to "return_requested"
      // This avoids permission issues on the customer side

      toast.success("Return request submitted successfully. Waiting for admin approval.");
      onClose();
    } catch (err) {
      console.error("Error submitting return request:", err);
      toast.error("Failed to submit return request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Reason for Returning Order #{order.id.slice(0, 4)}</h2>
        <textarea
          ref={textareaRef}
          value={reason}
          onChange={handleChange}
          placeholder="Type your reason here..."
          rows={3}
          className="
            w-full border rounded p-2 mb-4
            resize-none overflow-hidden
            focus:outline-none focus:ring-2 focus:ring-red-400
          "
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReasonForReturn;