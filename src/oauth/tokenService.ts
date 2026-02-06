import { redisClient } from "../redis/redisClient";

const TOKEN_CACHE_KEY = "oauth:access_token";
const TOKEN_TTL_SECONDS = 60;

// Prevent multiple concurrent token fetches
let inFlightPromise: Promise<string> | null = null;

export async function getAccessToken(): Promise<string> {
  // 1️⃣ Try Redis cache first
  try {
    const cached = await redisClient.get(TOKEN_CACHE_KEY);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.warn("Redis read failed, skipping cache");
  }

  // 2️⃣ Deduplicate concurrent token requests
  if (!inFlightPromise) {
    inFlightPromise = generateAndCacheToken();
  }

  try {
    return await inFlightPromise;
  } finally {
    inFlightPromise = null;
  }
}

async function generateAndCacheToken(): Promise<string> {
  // Simulated OAuth token (acceptable for assignment)
  const token = Buffer.from(
    `farmlokal-${Date.now()}-${Math.random()}`
  ).toString("base64");

  // Cache slightly less than expiry
  const cacheTTL = TOKEN_TTL_SECONDS - 5;

  try {
    await redisClient.set(
      TOKEN_CACHE_KEY,
      token,
      { EX: cacheTTL }
    );
  } catch (err) {
    console.warn("Redis write failed, token not cached");
  }

  return token;
}
