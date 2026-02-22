/**
 * Compute the final price after applying a productDiscount object.
 * discount shape: { type: "percent" | "fixed", value: number }
 */
export function applyDiscount(basePrice, discount) {
  const base = Number(basePrice || 0);
  if (!discount) return base;
  if (discount.type === "percent") {
    return Math.max(0, base - (base * Number(discount.value || 0)) / 100);
  }
  if (discount.type === "fixed") {
    return Math.max(0, base - Number(discount.value || 0));
  }
  return base;
}

/** Returns a human-readable discount label, e.g. "10%" or "€2.00" */
export function formatDiscount(discount) {
  if (!discount) return null;
  if (discount.type === "percent") return `${discount.value}% OFF`;
  if (discount.type === "fixed") return `€${Number(discount.value).toFixed(2)} OFF`;
  return null;
}
