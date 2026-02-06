import "dotenv/config";
import express from "express";
import { connectRedis } from "./redis/redisClient";


import usersRouter from "./routes/users";
import authRouter from "./routes/auth";
import productsRouter from "./routes/products";

import { fetchExternalData } from "./external/apiA";
import { handleWebhook } from "./external/apiBWebhook";
import { getAccessToken } from "./oauth/tokenService";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/**
 * Sanity routes
 */


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Farmlokal backend is running welcome to the page"
  });
});


/**
 * OAuth token test
 */
app.get("/oauth-token", async (_req, res) => {
  const token = await getAccessToken();
  res.json({ token });
});

/**
 * External API A (sync)
 */
app.get("/external/a", async (_req, res) => {
  try {
    const data = await fetchExternalData();
    res.json({ count: data.length });
  } catch(err) {
     console.error(err);
    res.status(503).json({ message: "External API unavailable" });
  }
});

/**
 * External API B (webhook)
 */
app.post("/webhook/external", handleWebhook);

/**
 * App routes
 */
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);

/**
 * Server bootstrap
 */

console.log(" Server starting...");


 
async function startServer() {
  await connectRedis();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(` Server running on ${PORT}`);
  });
}

startServer();


