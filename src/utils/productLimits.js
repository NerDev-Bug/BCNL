import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Decrease dailyLimit and pickupLeft for a single product by a given quantity.
 */
async function decreaseLimitForProduct(productId, productName, quantity, errors) {
  if (!productId || productId.startsWith("bundle_")) return;

  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      console.warn(`Product ${productId} not found`);
      return;
    }

    const productData = productSnap.data();
    const updateData = {};

    if (typeof productData.dailyLimit === "number" && productData.dailyLimit > 0) {
      updateData.dailyLimit = increment(-quantity);
    }
    if (typeof productData.pickupLeft === "number" && productData.pickupLeft > 0) {
      updateData.pickupLeft = increment(-quantity);
    }

    if (Object.keys(updateData).length > 0) {
      await updateDoc(productRef, updateData);
      console.log(`✅ Decreased limits for ${productName} ×${quantity}`);
    }
  } catch (error) {
    console.error(`Error updating limits for product ${productId}:`, error);
    errors.push({ productId, error });
  }
}

/**
 * Decrease dailyLimit and pickupLeft for products in an order.
 * Handles both regular products and bundle items.
 * @param {object} order - Order object with items array
 */
export async function decreaseProductLimits(order) {
  if (!order || !order.items || !Array.isArray(order.items)) {
    console.error("Invalid order data for decreasing product limits:", order);
    return;
  }

  const errors = [];

  for (const item of order.items) {
    const cartQty = item.quantity || 1;

    if (item.isBundle && Array.isArray(item.bundleItems) && item.bundleItems.length > 0) {
      // For bundles: deduct each bundleItem's qty × cart quantity
      for (const bi of item.bundleItems) {
        const totalQty = (bi.qty || 1) * cartQty;
        await decreaseLimitForProduct(bi.productId, bi.productName, totalQty, errors);
      }
    } else {
      // Regular product
      if (!item.productId || item.productId.startsWith("bundle_")) {
        console.log(`Skipping item ${item.name} - no valid productId`);
        continue;
      }
      await decreaseLimitForProduct(item.productId, item.name, cartQty, errors);
    }
  }

  if (errors.length > 0) {
    console.error("Some product limit updates failed:", errors);
  }

  return { success: errors.length === 0, errors };
}
