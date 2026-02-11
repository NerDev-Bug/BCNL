/**
 * Firebase Functions v2 + Mollie Payments
 * Project: bcnl-8c365 (BCNL)
 */

import { setGlobalOptions } from "firebase-functions/v2/options"
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https"
import * as logger from "firebase-functions/logger"
import { defineSecret } from "firebase-functions/params"
import createMollieClient, { Payment, PaymentMethod } from "@mollie/api-client"
import qs from "querystring"

// ✅ Firestore Admin
import admin from "firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

const MOLLIE_API_KEY = defineSecret("MOLLIE_API_KEY")

setGlobalOptions({ maxInstances: 10 })

const WEBHOOK_URL = "https://webhook-nmsgrcdlaa-uc.a.run.app"
const REDIRECT_URL =
  process.env.NODE_ENV === "production"
  ? "http://localhost:5173/payment-success"
  : "https://bakecorner-nl.vercel.app/payment-success"

/**
 * ✅ Create Mollie payment (CALLABLE)
 * Expects: { orderId: "<orders doc id>", amount, description, items }
 * Saves paymentId into: orders/{orderId}
 */
export const createPayment = onCall({ secrets: [MOLLIE_API_KEY] }, async (req) => {
  try {
    const { amount, description, orderId, items } = req.data || {}

    if (amount == null || !description) {
      throw new HttpsError("invalid-argument", "Missing amount or description")
    }

    // ✅ orderId must be the Firestore doc id in "orders"
    if (!orderId) {
      throw new HttpsError("invalid-argument", "Missing orderId")
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new HttpsError("invalid-argument", "Invalid amount")
    }

    const value = numericAmount.toFixed(2)

    // ✅ Make sure order exists
    const orderRef = db.collection("orders").doc(String(orderId))
    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Order document not found")
    }

    const mollie = createMollieClient({ apiKey: MOLLIE_API_KEY.value() })

    const payment = (await mollie.payments.create({
      amount: { currency: "EUR", value },
      description: String(description),

      // ✅ iDEAL only
      method: "ideal" as PaymentMethod,

      // ✅ redirect includes orderId (your success page can verify using orderId)
      redirectUrl: `${REDIRECT_URL}?orderId=${encodeURIComponent(String(orderId))}`,

      webhookUrl: WEBHOOK_URL,

      metadata: {
        orderId: String(orderId),
        items: items || null,
      },
    })) as Payment

    const checkoutUrl = (payment as any)?._links?.checkout?.href || null
    if (!checkoutUrl) {
      throw new HttpsError("internal", "Mollie did not return a checkout URL")
    }

    // ✅ Save paymentId into Firestore (instant verify later)
    await orderRef.set(
      {
        paymentId: payment.id,
        paymentStatus: payment.status || "open",
        paymentMethod: (payment as any)?.method || "ideal",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return {
      checkoutUrl,
      paymentId: payment.id,
      status: payment.status,
    }
  } catch (err: any) {
    logger.error("Create payment error", err)
    throw new HttpsError("internal", err?.message || "Failed to create payment")
  }
})

/**
 * ✅ Verify Mollie payment status instantly by reading paymentId from Firestore
 * Expects: { orderId: "<orders doc id>" }
 */
export const verifyMolliePayment = onCall({ secrets: [MOLLIE_API_KEY] }, async (req) => {
  try {
    // ✅ OPTIONAL: require login (remove if guest checkout)
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login required")
    }

    const orderId = req.data?.orderId ? String(req.data.orderId) : ""
    if (!orderId) {
      throw new HttpsError("invalid-argument", "Missing orderId")
    }

    const orderRef = db.collection("orders").doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Order document not found")
    }

    const orderData = orderSnap.data() || {}
    const paymentId = orderData.paymentId ? String(orderData.paymentId) : ""

    // If paymentId not saved yet, webhook/create might still be processing
    if (!paymentId) {
      return {
        status: "pending",
        orderId,
        paymentId: null,
      }
    }

    const mollie = createMollieClient({ apiKey: MOLLIE_API_KEY.value() })
    const payment = (await mollie.payments.get(paymentId)) as Payment

    const rawStatus = String(payment?.status || "").toLowerCase()

    // Mollie statuses: open, pending, authorized, paid, failed, canceled, expired
    let status: "paid" | "pending" | "failed" = "pending"
    if (rawStatus === "paid" || rawStatus === "authorized") status = "paid"
    else if (rawStatus === "failed" || rawStatus === "canceled" || rawStatus === "expired") status = "failed"

    // ✅ Update Firestore status for admin UI
    await orderRef.set(
      {
        paymentStatus: rawStatus,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return {
      status,
      orderId,
      paymentId: payment.id,
      method: (payment as any)?.method || null,
      amount: (payment as any)?.amount || null, // { value, currency }
      isTest: !!(payment as any)?.testmode,
    }
  } catch (err: any) {
    logger.error("verifyMolliePayment error", err)
    throw new HttpsError("internal", err?.message || "Failed to verify payment")
  }
})

/**
 * ✅ Mollie Webhook (HTTP)
 */
export const webhook = onRequest({ secrets: [MOLLIE_API_KEY] }, async (req, res) => {
  try {
    logger.info("Mollie webhook received", { method: req.method })

    let paymentId: string | null =
      (req.query?.id as string) ||
      (req.body?.id as string) ||
      null

    // Handle urlencoded body (Mollie sends this sometimes)
    if (!paymentId && req.rawBody) {
      const raw = req.rawBody.toString("utf8")
      const parsed = qs.parse(raw)
      paymentId = (parsed?.id as string) || null
    }

    if (!paymentId) {
      res.status(200).send("OK")
      return
    }

    const mollie = createMollieClient({ apiKey: MOLLIE_API_KEY.value() })
    const payment = (await mollie.payments.get(String(paymentId))) as Payment

    const orderId = (payment.metadata as any)?.orderId ? String((payment.metadata as any).orderId) : ""
    logger.info("Payment status", { paymentId, status: payment.status, orderId })

    // ✅ If we have orderId, update Firestore
    if (orderId) {
      await db.collection("orders").doc(orderId).set(
        {
          paymentStatus: payment.status || "open",
          paymentId: payment.id,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    res.status(200).send("OK")
    return
  } catch (err: any) {
    logger.error("Webhook error", err)
    res.status(200).send("OK")
    return
  }
})
