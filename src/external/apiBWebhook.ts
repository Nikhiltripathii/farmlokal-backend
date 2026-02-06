import { Request, Response } from "express";
import { redisClient } from "../redis/redisClient";

const IDEMPOTENCY_TTL_SECONDS = 60 * 60; // 1 hour

export async function handleWebhook(req: Request, res: Response) {
  try {
    const eventId = req.header("X-Event-Id");
    const { type, payload } = req.body;

    if (!eventId || !type) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    const redisKey = `webhook:event:${eventId}`;

    /* ===============================
       1️⃣ Idempotency lock (SET NX)
    =============================== */
    let lockAcquired = false;

    try {
      const result = await redisClient.set(
        redisKey,
        "processing",
        { NX: true, EX: IDEMPOTENCY_TTL_SECONDS }
      );

      lockAcquired = result === "OK";
    } catch (err) {
      console.warn("Redis unavailable, skipping idempotency lock");
      // If Redis is down, we still process once (best-effort)
      lockAcquired = true;
    }

    if (!lockAcquired) {
      // Duplicate or already in progress
      return res.status(200).json({ message: "Duplicate event ignored" });
    }

    /* ===============================
       2️⃣ Process event (business logic)
    =============================== */
    console.log("📩 Webhook received:", type, payload);

    /* ===============================
       3️⃣ Mark as processed
    =============================== */
    try {
      await redisClient.set(
        redisKey,
        "processed",
        { EX: IDEMPOTENCY_TTL_SECONDS }
      );
    } catch (err) {
      console.warn("Redis write failed after webhook processing");
    }

    return res.status(200).json({ message: "Event processed" });
  } catch (err) {
    console.error("Webhook handler error:", err);

    // Best-effort cleanup so provider can retry
    try {
      const eventId = req.header("X-Event-Id");
      if (eventId) {
        await redisClient.del(`webhook:event:${eventId}`);
      }
    } catch {
      // ignore cleanup failure
    }

    return res.status(500).json({ message: "Webhook processing failed" });
  }
}
