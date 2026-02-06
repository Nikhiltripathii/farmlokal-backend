import { Router } from "express";
import bcrypt from "bcrypt";
import { mysqlPool } from "../mysql";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { requireRole } from "../middlewares/role";

const router = Router();

// REGISTER USER
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const conn = await mysqlPool.getConnection();

    await conn.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "buyer"]
    );

    conn.release();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// 🔐 GET /users/me (PROTECTED)
router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({
    user: req.user,
  });
});

// TEST: farmer-only route
router.post(
  "/farmer-only",
  authMiddleware,
  requireRole(["farmer"]),
  (req, res) => {
    res.json({ message: "Hello farmer 🌾" });
  }
);


export default router;
