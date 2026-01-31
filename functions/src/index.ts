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

const MOLLIE_API_KEY = defineSecret("MOLLIE_API_KEY")

setGlobalOptions({ maxInstances: 10 })

const WEBHOOK_URL = "https://webhook-nmsgrcdlaa-uc.a.run.app"
const REDIRECT_URL = "http://localhost:5173/payment-success"

/**
 * ✅ Create Mollie payment (CALLABLE)
 */
export const createPayment = onCall({ secrets: [MOLLIE_API_KEY] }, async (req) => {
  try {
    const { amount, description, orderId, items } = req.data || {}

    if (amount == null || !description) {
      throw new HttpsError("invalid-argument", "Missing amount or description")
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new HttpsError("invalid-argument", "Invalid amount")
    }

    const value = numericAmount.toFixed(2)

    const mollie = createMollieClient({ apiKey: MOLLIE_API_KEY.value() })

    const payment = (await mollie.payments.create({
      amount: { currency: "EUR", value },
      description: String(description),

      // ✅ iDEAL only
      method: "ideal" as PaymentMethod,

      redirectUrl: REDIRECT_URL,
      webhookUrl: WEBHOOK_URL,

      metadata: {
        orderId: orderId || null,
        items: items || null,
      },
    })) as Payment

    const checkoutUrl =
      (payment as any)?._links?.checkout?.href || null

    if (!checkoutUrl) {
      throw new HttpsError("internal", "Mollie did not return a checkout URL")
    }

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

    // Mollie test webhook can send no ID
    if (!paymentId) {
      res.status(200).send("OK")
      return
    }

    const mollie = createMollieClient({ apiKey: MOLLIE_API_KEY.value() })
    const payment = (await mollie.payments.get(String(paymentId))) as Payment

    logger.info("Payment status", {
      paymentId,
      status: payment.status,
      metadata: payment.metadata,
    })

    if (payment.status === "paid") {
      logger.info("✅ Payment paid", { paymentId })
      // TODO: update Firestore using (payment.metadata as any)?.orderId
    }

    res.status(200).send("OK")
    return
  } catch (err: any) {
    logger.error("Webhook error", err)
    res.status(200).send("OK")
    return
  }
})
