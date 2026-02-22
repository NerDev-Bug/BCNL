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

/**
 * Create a notification for admin
 * @param {string} message - Notification message
 * @param {object} options - Additional options
 * @param {string} options.link - Link to navigate (e.g., "/admin/orders?tab=returned")
 * @param {string} options.type - Notification type (e.g., "return_request")
 * @param {object} options.data - Additional data to store (e.g., orderId)
 */
export async function createAdminNotification(message, options = {}) {
  try {
    // Admin notifications are stored in a collection called "adminNotifications"
    const notificationRef = collection(db, "adminNotifications");
    await addDoc(notificationRef, {
      message,
      link: options.link || null,
      type: options.type || "general",
      data: options.data || null,
      read: false,
      seen: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating admin notification:", error);
    throw error;
  }
}

/**
 * Create admin notification when customer requests a return
 * @param {object} order - Order object with return information
 */
export async function createReturnRequestNotification(order) {
  try {
    console.log("createReturnRequestNotification called with order:", order);
    
    if (!order || !order.id) {
      console.error("Invalid order data:", order);
      throw new Error("Order ID is required");
    }

    const customerName = order.orderData?.receiverName || "Customer";
    const orderNumber = order.id.slice(0, 4);
    const message = `${customerName} has requested a return for order #${orderNumber}`;
    
    console.log("Creating admin notification:", {
      message,
      customerName,
      orderNumber,
      orderId: order.id,
    });
    
    await createAdminNotification(message, {
      link: "/admin/orders?tab=returned",
      type: "return_request",
      data: {
        orderId: order.id,
        customerName: customerName,
        returnReason: order.returnReason || null,
      },
    });
    
    console.log("Admin notification created successfully");
  } catch (error) {
    console.error("Error creating return request notification:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Create customer notification when admin approves return request
 * @param {object} order - Order object with userId
 */
export async function createReturnApprovedNotification(order) {
  try {
    if (!order || !order.userId || !order.id) {
      console.error("Invalid order data for return approved notification:", order);
      return;
    }

    const orderNumber = order.id.slice(0, 4);
    const message = `Your return request for order #${orderNumber} has been approved. Refund will be processed soon.`;

    await createNotification(order.userId, message, {
      link: "/order",
      type: "return_approved",
      data: {
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("Error creating return approved notification:", error);
  }
}

/**
 * Create customer notification when admin rejects return request
 * @param {object} order - Order object with userId
 * @param {string} [rejectionMessage] - Optional reason/message from admin for rejection
 */
export async function createReturnRejectedNotification(order, rejectionMessage) {
  try {
    if (!order || !order.userId || !order.id) {
      console.error("Invalid order data for return rejected notification:", order);
      return;
    }

    const orderNumber = order.id.slice(0, 4);
    let message = `Your return request for order #${orderNumber} has been rejected.`;
    if (rejectionMessage && rejectionMessage.trim()) {
      message += ` Reason: ${rejectionMessage.trim()}`;
    }
    message += " Please contact support if you have questions.";

    await createNotification(order.userId, message, {
      link: "/order",
      type: "return_rejected",
      data: {
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("Error creating return rejected notification:", error);
  }
}

/**
 * Create customer notification when order status changes to preparing
 * @param {object} order - Order object with userId
 */
export async function createOrderPreparingNotification(order) {
  try {
    if (!order || !order.userId || !order.id) {
      console.error("Invalid order data for preparing notification:", order);
      return;
    }

    const orderNumber = order.id.slice(0, 4);
    const message = `Your order #${orderNumber} is now being prepared! 🍰`;

    await createNotification(order.userId, message, {
      link: "/order",
      type: "order_preparing",
      data: {
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("Error creating order preparing notification:", error);
  }
}

/**
 * Create customer notification when order status changes to to_delivered
 * @param {object} order - Order object with userId
 */
export async function createOrderToDeliveredNotification(order) {
  try {
    if (!order || !order.userId || !order.id) {
      console.error("Invalid order data for to delivered notification:", order);
      return;
    }

    const orderNumber = order.id.slice(0, 4);
    const message = `Your order #${orderNumber} is out for delivery! 🚚`;

    await createNotification(order.userId, message, {
      link: "/order",
      type: "order_to_delivered",
      data: {
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("Error creating order to delivered notification:", error);
  }
}

/**
 * Create admin notification when customer places a new order
 * @param {object} order - Order object with order information
 */
export async function createNewOrderAdminNotification(order) {
  try {
    if (!order || !order.id) {
      console.error("Invalid order data for new order notification:", order);
      return;
    }

    const customerName = order.orderData?.receiverName || "Customer";
    const orderNumber = order.id.slice(0, 4);
    const total = order.total || 0;
    const message = `New order #${orderNumber} from ${customerName} - €${total.toFixed(2)}`;

    await createAdminNotification(message, {
      link: "/admin/orders?tab=paid",
      type: "new_order",
      data: {
        orderId: order.id,
        customerName: customerName,
        total: total,
      },
    });
  } catch (error) {
    console.error("Error creating new order admin notification:", error);
  }
}

/**
 * Create customer notification when admin marks order as refunded
 * @param {object} order - Order object with userId
 */
export async function createRefundNotification(order) {
  try {
    if (!order || !order.userId || !order.id) {
      console.error("Invalid order data for refund notification:", order);
      return;
    }

    const orderNumber = order.id.slice(0, 4);
    const message = `Your refund for order #${orderNumber} has been processed. The amount will be credited to your account soon.`;

    await createNotification(order.userId, message, {
      link: "/order",
      type: "refund_processed",
      data: {
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("Error creating refund notification:", error);
  }
}

/**
 * Create customer notification when admin cancels/deletes a pending order
 * @param {object} order - Order object with userId
 */
export async function createOrderCancelledNotification(order) {
  try {
    if (!order || !order.userId || !order.id) return;

    const orderNumber = order.id.slice(0, 4);
    const message = `Your order #${orderNumber} has been cancelled by the store. Please contact us for assistance.`;

    await createNotification(order.userId, message, {
      link: "/order",
      type: "order_cancelled",
      data: { orderId: order.id },
    });
  } catch (error) {
    console.error("Error creating order cancelled notification:", error);
  }
}
