/**
 * Compute the displayed unit price after applying a productDiscount.
 *
 * Discount shapes:
 *   { type: "percent", value: 10 }
 *   { type: "fixed",   value: 5 }
 *   { type: "buy1take1", promoPrice: 7.00 }   ← optional promoPrice for the pair
 *   { type: "xForY",  buyQty: 3, forPrice: 10 }
 */
/**
 * Returns the unit price to DISPLAY and STORE in cart.
 * For B1T1: always returns the base price — savings are shown via badge and
 * applied at total calculation time via applyDiscountTotal().
 * For xForY: returns effective unit price (forPrice / buyQty).
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
  // B1T1: if admin set a promoPrice, that IS the final price (total for the pair shown as unit)
  if (discount.type === "buy1take1") {
    if (discount.promoPrice != null && Number(discount.promoPrice) > 0) {
      return Math.max(0, Number(discount.promoPrice));
    }
    return base; // no promoPrice → price unchanged, free item at checkout level
  }
  if (discount.type === "xForY") {
    const buyQty = Number(discount.buyQty || 2);
    const forPrice = Number(discount.forPrice || base);
    return Math.max(0, forPrice / buyQty);
  }
  return base;
}

/**
 * Compute the TOTAL for a line item (handles promo mechanics correctly).
 */
export function applyDiscountTotal(basePrice, discount, quantity) {
  const base = Number(basePrice || 0);
  const qty = Number(quantity || 1);
  if (!discount) return base * qty;

  if (discount.type === "percent") {
    return Math.max(0, base - (base * Number(discount.value || 0)) / 100) * qty;
  }
  if (discount.type === "fixed") {
    return Math.max(0, base - Number(discount.value || 0)) * qty;
  }
  if (discount.type === "buy1take1") {
    if (discount.promoPrice != null && Number(discount.promoPrice) > 0) {
      // promoPrice is the final price for the pair — qty of 1 or 2 both cost promoPrice
      // For every 2 added: pay promoPrice. Odd remainder: pay promoPrice too (they get the deal)
      return Number(discount.promoPrice) * qty;
    }
    // No promoPrice: every 2nd item is free → pay for ceil(qty/2)
    const paidQty = Math.ceil(qty / 2);
    return base * paidQty;
  }
  if (discount.type === "xForY") {
    const buyQty = Number(discount.buyQty || 2);
    const forPrice = Number(discount.forPrice || base * buyQty);
    const fullSets = Math.floor(qty / buyQty);
    const remainder = qty % buyQty;
    return fullSets * forPrice + remainder * base;
  }
  return base * qty;
}

/**
 * Human-readable badge label.
 * For B1T1 with promoPrice: "Buy 1 Take 1 · €7.00/pair"
 * For B1T1 without:         "Buy 1 Take 1"
 */
export function formatDiscount(discount) {
  if (!discount) return null;
  if (discount.type === "percent") return `${discount.value}% OFF`;
  if (discount.type === "fixed") return `€${Number(discount.value).toFixed(2)} OFF`;
  if (discount.type === "buy1take1") {
    return "Buy 1 Take 1";
  }
  if (discount.type === "xForY") {
    return `${discount.buyQty} for €${Number(discount.forPrice).toFixed(2)}`;
  }
  return null;
}
