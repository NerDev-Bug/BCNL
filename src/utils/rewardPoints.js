import { db } from "../firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

/**
 * Calculate total reward points from order items
 * @param {object} order - Order object with items array
 * @returns {number} Total reward points earned
 */
export async function calculateRewardPoints(order) {
  if (!order || !order.items || !Array.isArray(order.items)) {
    console.error("Invalid order data for calculating reward points:", order);
    return 0;
  }

  let totalPoints = 0;

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
      const rewardPoints = Number(productData.rewardPoints || 0);
      const quantity = item.quantity || 1;

      // Add points: rewardPoints per product * quantity
      totalPoints += rewardPoints * quantity;
    } catch (error) {
      console.error(`Error calculating points for product ${item.productId}:`, error);
    }
  }

  return totalPoints;
}

/**
 * Update user's reward points by adding the earned points
 * @param {string} userId - User ID
 * @param {number} pointsEarned - Points to add
 * @returns {Promise<number>} New total points
 */
export async function updateUserRewardPoints(userId, pointsEarned) {
  if (!userId || !pointsEarned || pointsEarned <= 0) {
    console.log("Invalid parameters for updating reward points");
    return 0;
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`User ${userId} not found`);
      return 0;
    }

    // Use increment to atomically add points
    await updateDoc(userRef, {
      points: increment(pointsEarned),
    });

    const currentPoints = Number(userSnap.data()?.points || 0);
    const newTotal = currentPoints + pointsEarned;

    console.log(`✅ Updated reward points for user ${userId}: +${pointsEarned} (Total: ${newTotal})`);
    return newTotal;
  } catch (error) {
    console.error(`Error updating reward points for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Process reward points for a completed order
 * @param {object} order - Order object with items array and userId
 * @returns {Promise<number>} Points earned
 */
export async function processOrderRewardPoints(order) {
  if (!order || !order.userId) {
    console.error("Invalid order data for processing reward points:", order);
    return 0;
  }

  const pointsEarned = await calculateRewardPoints(order);
  
  if (pointsEarned > 0) {
    await updateUserRewardPoints(order.userId, pointsEarned);
  }

  return pointsEarned;
}
