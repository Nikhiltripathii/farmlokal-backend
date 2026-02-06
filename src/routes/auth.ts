import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { mysqlPool } from "../mysql";

const router = Router();

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const conn = await mysqlPool.getConnection();

  const [rows]: any = await conn.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  conn.release();

  if (rows.length === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = rows[0];

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login successful",
    token,
  });
});

export default router;
