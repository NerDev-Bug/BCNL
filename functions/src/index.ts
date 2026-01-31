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

    // ✅ require orderId so redirect can use it
    if (!orderId) {
      throw new HttpsError("invalid-argument", "Missing orderId")
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

      // ✅ FIX: use orderId (already available), NOT payment.id
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
 * ✅ Verify Mollie payment by orderId (CALLABLE)
 * Frontend calls this from /payment-success?orderId=xxx
 */
export const verifyMolliePayment = onCall({ secrets: [MOLLIE_API_KEY] }, async (req) => {
  try {
    // ✅ OPTIONAL: require logged in user
    // If you allow guest checkout, remove this block.
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Login required")
    }

    const orderId = req.data?.orderId ? String(req.data.orderId) : ""
    if (!orderId) {
      throw new HttpsError("invalid-argument", "Missing orderId")
    }

    const mollie = createMollieClient({ apiKey: MOLLIE_API_KEY.value() })

    // ✅ Find latest payment that matches metadata.orderId
    // We page through a few results to find it.
    let matched: any = null
    let cursor: any = undefined

    for (let i = 0; i < 5; i++) {
      const page = await mollie.payments.page({
        limit: 50,
        from: cursor,
      } as any)

      const found = (page as any)?.find((p: any) => String(p?.metadata?.orderId || "") === orderId)
      if (found) {
        matched = found
        break
      }

      // stop if no next cursor
      const next = (page as any)?._links?.next?.href
      if (!next) break

      // Mollie pagination uses "from" token; api-client stores it internally in nextPage() too,
      // but using cursor is okay if available. If not, break.
      cursor = (page as any)?._links?.next?.href
      // If cursor isn't usable in your client version, you can remove paging and just keep first page.
    }

    // If not found, still return pending (webhook might not have processed yet)
    if (!matched) {
      return { status: "pending", orderId, paymentId: null }
    }

    const rawStatus = String(matched.status || "").toLowerCase()

    let status: "paid" | "pending" | "failed" = "pending"
    if (rawStatus === "paid" || rawStatus === "authorized") status = "paid"
    else if (rawStatus === "failed" || rawStatus === "canceled" || rawStatus === "expired") status = "failed"

    return {
      status,
      orderId,
      paymentId: matched.id,
      method: matched.method || null,
      amount: matched.amount || null, // { value, currency }
      isTest: !!matched.testmode,
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

    let paymentId: string | null = (req.query?.id as string) || (req.body?.id as string) || null

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
