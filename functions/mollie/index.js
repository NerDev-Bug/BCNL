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
 * Create payment (called from React)
 * - Requires user logged in (context/auth)
 * - Creates/updates Firestore order doc
 * - Creates Mollie payment
 * - Returns checkoutUrl
 */
exports.createMolliePayment = onCall({ secrets: [MOLLIE_KEY] }, async (req) => {
  if (!req.auth) throw new Error("Unauthenticated. Please login first.")

  const { method, amount, orderId, items } = req.data || {}

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

  const mollie = createMollieClient({ apiKey: MOLLIE_KEY.value() })

  // ✅ Create/merge order doc (store cart snapshot)
  await admin.firestore().collection("orders").doc(orderId).set(
    {
      userId: req.auth.uid,
      items: Array.isArray(items) ? items : [],
      amount: n,
      currency: "EUR",
      method,
      status: "pending_payment",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  // ✅ Create Mollie payment
  const payment = await mollie.payments.create({
    amount: { currency: "EUR", value },
    method,
    description: `Order #${orderId}`,
    redirectUrl: `${FRONTEND_URL.value()}/payment/success?orderId=${encodeURIComponent(orderId)}`,
    webhookUrl: `${req.rawRequest.protocol}://${req.rawRequest.get("host")}/mollieWebhook`,
    metadata: {
      orderId,
      userId: req.auth.uid,
    },
  })

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
