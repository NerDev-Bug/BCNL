import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Create a notification for a user
 * @param {string} userId - User ID
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 * @param {string} options.link - Link to navigate (e.g., "/product/123")
 * @param {string} options.type - Notification type (e.g., "delivery", "review")
 * @param {object} options.data - Additional data to store
 */
export async function createNotification(userId, message, options = {}) {
  try {
    const notificationRef = collection(db, "users", userId, "notifications");
    await addDoc(notificationRef, {
      message,
      link: options.link || null,
      type: options.type || "general",
      data: options.data || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create delivery notifications for all products in an order
 * @param {object} order - Order object with items and userId
 */
export async function createDeliveryNotifications(order) {
  console.log("🔔 createDeliveryNotifications called with order:", order);
  
  if (!order || !order.userId || !order.items || order.items.length === 0) {
    console.warn("⚠️ Missing order data:", { 
      hasOrder: !!order, 
      hasUserId: !!order?.userId, 
      hasItems: !!order?.items, 
      itemsLength: order?.items?.length 
    });
    return;
  }

  console.log("📦 Order items:", order.items);
  console.log("👤 User ID:", order.userId);

  // Filter items that have productId (skip items without productId like custom cakes without productId)
  const itemsWithProductId = order.items.filter((item) => item.productId && item.productId !== null);
  console.log("✅ Items with productId:", itemsWithProductId.length, "out of", order.items.length);

  if (itemsWithProductId.length === 0) {
    console.warn("⚠️ No items with productId found. Items structure:", order.items.map(item => ({
      name: item.name,
      hasProductId: !!item.productId,
      productId: item.productId
    })));
    
    // Still create a general notification if no productId items
    if (order.items.length > 0) {
      const firstItem = order.items[0];
      console.log("📨 Creating general delivery notification (no productId)");
      try {
        await createNotification(
          order.userId,
          `Your order #${order.id.slice(0, 4)} has been delivered! 🎉`,
          {
            link: null,
            type: "delivery",
            data: {
              orderId: order.id,
              productId: null,
              productName: firstItem.name,
            },
          }
        );
        console.log("✅ General notification created");
      } catch (err) {
        console.error("❌ Failed to create general notification:", err);
      }
    }
    return;
  }

  const notifications = itemsWithProductId.map((item) => ({
    message: `Your order for "${item.name}" has been delivered! 🎉 Leave a review to help others.`,
    link: `/product/${item.productId}`,
    type: "delivery",
    data: {
      orderId: order.id,
      productId: item.productId,
      productName: item.name,
    },
  }));

  console.log("📨 Creating", notifications.length, "notifications for user:", order.userId);

  // Create notifications in parallel
  try {
    const results = await Promise.allSettled(
      notifications.map(async (notif, index) => {
        try {
          console.log(`Creating notification ${index + 1}/${notifications.length}:`, notif.message);
          await createNotification(order.userId, notif.message, {
            link: notif.link,
            type: notif.type,
            data: notif.data,
          });
          console.log(`✅ Notification ${index + 1} created successfully`);
          return { success: true, index };
        } catch (err) {
          console.error(`❌ Failed to create notification ${index + 1}:`, err);
          console.error("Error details:", {
            code: err.code,
            message: err.message,
            userId: order.userId
          });
          return { success: false, index, error: err };
        }
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log(`✅ Notifications summary: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      console.error("Some notifications failed. Check console for details.");
    }
  } catch (error) {
    console.error("❌ Unexpected error creating notifications:", error);
    throw error;
  }
}
