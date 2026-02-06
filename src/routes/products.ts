import { Router, Request, Response } from "express";
import { mysqlPool } from "../mysql";
import { redisClient } from "../redis/redisClient";

const router = Router();

const CACHE_TTL_SECONDS = 60; // 1 minute

router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor =
      typeof req.query.cursor === "string" ? req.query.cursor : null;

    const cacheKey = `products:${limit}:${cursor ?? "first"}`;

    /* ===============================
       1. Redis READ (safe)
    =============================== */
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch {
      // Redis down → ignore cache
    }

    /* ===============================
       2. Decode cursor (STRING ONLY)
    =============================== */
    let cursorCreatedAt: string | null = null;
    let cursorId: number | null = null;

    if (cursor) {
      const decoded = Buffer.from(cursor, "base64").toString("utf8");
      const parts = decoded.split("|");

      if (parts.length === 2) {
        cursorCreatedAt = parts[0];
        cursorId = Number(parts[1]);
      }
    }

    /* ===============================
       3. SQL Query
    =============================== */
    let whereClause = "";
    const params: any[] = [];

    if (cursorCreatedAt && cursorId !== null) {
      whereClause = `
        WHERE (
          p.created_at < ?
          OR (p.created_at = ? AND p.id < ?)
        )
      `;
      params.push(cursorCreatedAt, cursorCreatedAt, cursorId);
    }

    const conn = await mysqlPool.getConnection();

    const [rows]: any[] = await conn.query(
      `
      SELECT
        p.id,
        p.name,
        p.price,
        p.quantity,
        p.created_at,
        u.email AS farmer
      FROM products p
      JOIN users u ON u.id = p.farmer_id
      ${whereClause}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ?
      `,
      [...params, limit + 1]
    );

    conn.release();

    /* ===============================
       4. Build nextCursor
    =============================== */
    let nextCursor: string | null = null;

    if (rows.length > limit) {
      const last = rows[limit - 1];
      nextCursor = Buffer.from(
        `${last.created_at}|${last.id}`
      ).toString("base64");
      rows.length = limit;
    }

    const response = {
      items: rows,
      nextCursor,
    };

    /* ===============================
       5. Redis WRITE (safe)
    =============================== */
    try {
      await redisClient.set(
        cacheKey,
        JSON.stringify(response),
        { EX: CACHE_TTL_SECONDS }
      );
    } catch {
      // Redis down → ignore cache
    }

    return res.json(response);
  } catch (err) {
    console.error("Products API error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
