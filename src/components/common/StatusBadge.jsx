export function StatusBadge({ value }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase";

  const styles = {
    pending: "bg-amber-100 text-amber-700",
    preparing: "bg-green-100 text-green-700",
    fulfilled: "bg-green-100 text-green-700",
    unfulfilled: "bg-red-100 text-red-700",

    cod: "bg-blue-100 text-blue-700",
    gcash: "bg-purple-100 text-purple-700",
  };

  return (
    <span className={`${base} ${styles[value?.toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
      {value || "N/A"}
    </span>
  );
}
export default StatusBadge;