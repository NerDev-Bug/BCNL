const admin = require("firebase-admin")
admin.initializeApp()

const { onCall, onRequest } = require("firebase-functions/v2/https")
const { defineSecret, defineString } = require("firebase-functions/params")
const createMollieClient = require("mollie-api-node")

// ✅ Secret + param (no functions.config())
const MOLLIE_KEY = defineSecret("MOLLIE_KEY")
const FRONTEND_URL = { value: () => "http://localhost:5173" }

/**
 * Optional test endpoint (visit in browser after deploy)
 */
exports.helloMollie = onRequest((req, res) => {
  res.status(200).send("Hello Mollie is working!")
})

/**
 * Test function to check if MOLLIE_KEY secret is accessible
 */
exports.testMollieSecret = onCall({ secrets: [MOLLIE_KEY] }, async (request) => {
  try {
    const key = MOLLIE_KEY.value()
    return {
      success: true,
      message: "MOLLIE_KEY is configured",
      keyLength: key ? key.length : 0
    }
  } catch (error) {
    return {
      success: false,
      message: "MOLLIE_KEY is not configured",
      error: error.message
    }
  }
})

/**
 * Create payment (called from React)
 * - Requires user logged in (context/auth)
 * - Creates/updates Firestore order doc
 * - Creates Mollie payment
 * - Returns checkoutUrl
 */
exports.createMolliePayment = onCall({ secrets: [MOLLIE_KEY] }, async (request) => {
  console.log("createMolliePayment called", {
    hasAuth: !!request.auth,
    authUid: request.auth?.uid,
    dataKeys: Object.keys(request.data || {})
  })

  try {
    // Validate authentication first
    if (!request.auth) {
      console.error("No authentication found")
      throw new Error("Unauthenticated. Please login first.")
    }

    // Get Mollie API key early to fail fast if not configured
    let mollieApiKey
    try {
      mollieApiKey = MOLLIE_KEY.value()
      if (!mollieApiKey || typeof mollieApiKey !== 'string' || mollieApiKey.trim().length === 0) {
        console.error("MOLLIE_KEY is empty or invalid")
        throw new Error("MOLLIE_KEY secret is not configured or is empty")
      }
      console.log("MOLLIE_KEY retrieved successfully (length:", mollieApiKey.length, ")")
    } catch (err) {
      console.error("Error accessing MOLLIE_KEY:", {
        message: err.message,
        name: err.name,
        stack: err.stack
      })
      throw new Error("Mollie API key is not configured. Please set MOLLIE_KEY secret in Firebase Functions using: firebase functions:secrets:set MOLLIE_KEY")
    }

    const { method, amount, orderId, items, customer } = request.data || {}
    console.log("Request data:", { method, amount, orderId, itemsCount: items?.length, hasCustomer: !!customer })

    if (!orderId) throw new Error("Missing orderId")
    if (!method) throw new Error("Missing method")
    if (amount === undefined || amount === null) throw new Error("Missing amount")

    if (!["ideal", "paypal"].includes(method)) {
      throw new Error("Invalid payment method. Use 'ideal' or 'paypal'.")
    }

    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid amount")

    // Mollie requires "10.00" string
    const value = n.toFixed(2)
    console.log("Payment amount:", value, "EUR")

    const mollie = createMollieClient({ apiKey: mollieApiKey })
    console.log("Mollie client created")

    // Get user email safely
    const userEmail = request.auth.token?.email || null
    console.log("User email:", userEmail)

    // ✅ Create/merge order doc (store cart snapshot + customer info)
    try {
      await admin.firestore().collection("orders").doc(orderId).set(
        {
          userId: request.auth.uid,
          userEmail: userEmail,
          items: Array.isArray(items) ? items : [],
          customer: customer || {},
          totalPrice: n,
          amount: n,
          currency: "EUR",
          method,
          status: "pending_payment",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      console.log("Order document created in Firestore:", orderId)
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError)
      throw new Error(`Failed to save order: ${firestoreError.message}`)
    }

    // Construct webhook URL for Firebase Functions v2
    // For codebase-specific functions: https://REGION-PROJECT_ID.cloudfunctions.net/mollie-mollieWebhook
    // For standard functions: https://REGION-PROJECT_ID.cloudfunctions.net/mollieWebhook
    const projectId = admin.app().options.projectId
    const region = process.env.FUNCTION_REGION || process.env.GCLOUD_REGION || "us-central1"
    
    // Try codebase-specific format first (mollie-mollieWebhook), fallback to standard
    // You may need to adjust this based on your actual deployed function name
    const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/mollie-mollieWebhook`
    
    console.log("Webhook URL:", webhookUrl, "Project:", projectId, "Region:", region)

    // ✅ Create Mollie payment
    let payment
    try {
      const paymentData = {
        amount: { currency: "EUR", value },
        method,
        description: `Order #${orderId}`,
        redirectUrl: `${FRONTEND_URL.value()}/payment/success?orderId=${encodeURIComponent(orderId)}`,
        webhookUrl: webhookUrl,
        metadata: {
          orderId,
          userId: request.auth.uid,
        },
      }
      console.log("Creating Mollie payment with data:", JSON.stringify(paymentData, null, 2))
      
      payment = await mollie.payments.create(paymentData)
      console.log("Mollie payment created:", payment.id, "Status:", payment.status)
    } catch (mollieError) {
      console.error("Mollie API error:", {
        message: mollieError.message,
        field: mollieError.field,
        status: mollieError.status
      })
      throw new Error(`Mollie payment failed: ${mollieError.message || "Unknown error"}`)
    }

    // ✅ Save Mollie paymentId
    await admin.firestore().collection("orders").doc(orderId).set(
      {
        molliePaymentId: payment.id,
        mollieStatus: payment.status,
        status: "payment_created",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return {
      orderId,
      paymentId: payment.id,
      checkoutUrl: payment.getCheckoutUrl(),
    }
  } catch (error) {
    // Log full error details for debugging
    const errorDetails = {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      details: error.details
    }
    console.error("createMolliePayment error:", JSON.stringify(errorDetails, null, 2))
    
    // Return a user-friendly error message
    // Firebase Functions v2 will automatically convert this to proper HTTP response
    const errorMessage = error.message || "Failed to create payment"
    
    // Re-throw with the error message so it's properly returned to the client
    throw new Error(errorMessage)
  }
})

/**
 * Mollie webhook (server-to-server)
 * - Mollie POSTs: id=tr_xxx
 * - We fetch payment from Mollie and update Firestore order status
 */
exports.mollieWebhook = onRequest({ secrets: [MOLLIE_KEY] }, async (req, res) => {
  try {
    const paymentId = req.body?.id || req.query?.id
    if (!paymentId) return res.status(400).send("Missing payment id")

    const mollie = createMollieClient({ apiKey: MOLLIE_KEY.value() })
    const payment = await mollie.payments.get(paymentId)

    const orderId = payment.metadata?.orderId
    if (!orderId) return res.status(200).send("OK")

    // Mollie payment.status: open, pending, paid, failed, canceled, expired
    const status = payment.status

    await admin.firestore().collection("orders").doc(orderId).set(
      {
        molliePaymentId: payment.id,
        mollieStatus: status,
        status, // you can map to your own statuses if you want
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return res.status(200).send("OK")
  } catch (err) {
    console.error(err)
    return res.status(500).send("Webhook error")
  }
})
