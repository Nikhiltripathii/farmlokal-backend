import { Request, Response, NextFunction } from "express";
import { redisClient } from "../redis/redisClient";

const WINDOW_SECONDS = 60;   // 1 minute
const MAX_REQUESTS = 100;   // per IP per window

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Use X-Forwarded-For safe IP (Render / proxies)
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const key = `ratelimit:${ip}`;

    // Atomic increment
    const count = await redisClient.incr(key);

    // First request → set TTL
    if (count === 1) {
      await redisClient.expire(key, WINDOW_SECONDS);
    }

    if (count > MAX_REQUESTS) {
      return res.status(429).json({
        message: "Too many requests, please try again later",
      });
    }

    return next();
  } catch (err) {
    console.error("Rate limit error:", err);
    // Fail-open: allow request if Redis is down
    return next();
  }
}


