import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Decrease dailyLimit and pickupLeft for products in an order
 * @param {object} order - Order object with items array
 */
export async function decreaseProductLimits(order) {
  if (!order || !order.items || !Array.isArray(order.items)) {
    console.error("Invalid order data for decreasing product limits:", order);
    return;
  }

  const updates = [];
  const errors = [];

  for (const item of order.items) {
    if (!item.productId) {
      console.log(`Skipping item ${item.name} - no productId`);
      continue;
    }

    try {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        console.warn(`Product ${item.productId} not found`);
        continue;
      }

      const productData = productSnap.data();
      const quantity = item.quantity || 1;

      // Prepare update object
      const updateData = {};

      // Decrease dailyLimit if it exists and is a number
      if (typeof productData.dailyLimit === "number" && productData.dailyLimit > 0) {
        updateData.dailyLimit = increment(-quantity);
      }

      // Decrease pickupLeft if it exists and is a number
      if (typeof productData.pickupLeft === "number" && productData.pickupLeft > 0) {
        updateData.pickupLeft = increment(-quantity);
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        updates.push({ productRef, updateData, productName: item.name, quantity });
      } else {
        console.log(`Product ${item.name} has no dailyLimit or pickupLeft to decrease`);
      }
    } catch (error) {
      console.error(`Error processing product ${item.productId}:`, error);
      errors.push({ productId: item.productId, error });
    }
  }

  // Execute all updates
  for (const { productRef, updateData, productName, quantity } of updates) {
    try {
      await updateDoc(productRef, updateData);
      console.log(
        `✅ Decreased limits for ${productName}: dailyLimit=${updateData.dailyLimit?.increment || "N/A"}, pickupLeft=${updateData.pickupLeft?.increment || "N/A"}`
      );
    } catch (error) {
      console.error(`Failed to update product ${productName}:`, error);
      errors.push({ productRef: productRef.id, error });
    }
  }

  if (errors.length > 0) {
    console.error(`Some product limit updates failed:`, errors);
  }

  return { success: errors.length === 0, errors };
}
