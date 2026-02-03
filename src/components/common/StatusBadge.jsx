export function StatusBadge({ value }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase";

  const styles = {
    // Order statuses
    pending: "bg-amber-100 text-amber-700",
    preparing: "bg-green-100 text-green-700",
    to_delivered: "bg-green-100 text-green-700",
    delivered: "bg-green-100 text-green-700",
    returned: "bg-red-100 text-red-700",

    // Product availability
    available: "bg-green-100 text-green-700",
    unavailable: "bg-red-100 text-red-700",

    // User status
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-700",
    banned: "bg-red-100 text-red-700",

    // Payment status
    paid: "bg-green-100 text-green-700",
    unpaid: "bg-red-100 text-red-700",
    cod: "bg-blue-100 text-blue-700",
    ideal: "bg-[#EC008C] text-white",
  };

  return (
    <span className={`${base} ${styles[value?.toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
      {value || "N/A"}
    </span>
  );
}
export default StatusBadge;