import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { openapi } from "./openapi.js";
import admin from "./routes/admin.js";
import auth from "./routes/auth.js";
import cart from "./routes/cart.js";
import categories from "./routes/categories.js";
import contact, { newsletter } from "./routes/contact.js";
import orders from "./routes/orders.js";
import products from "./routes/products.js";
import reviews from "./routes/reviews.js";
import wishlist from "./routes/wishlist.js";

export function createApp() {
  const app = express();
  if (config.trustProxy) app.set("trust proxy", /^\d+$/.test(config.trustProxy) ? Number(config.trustProxy) : config.trustProxy);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/openapi.json", (_req, res) => {
    res.json(openapi);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

  app.use("/api/auth", auth);
  app.use("/api/categories", categories);
  app.use("/api/products", products);
  app.use("/api/cart", cart);
  app.use("/api/orders", orders);
  app.use("/api/reviews", reviews);
  app.use("/api/contact", contact);
  app.use("/api/newsletter", newsletter);
  app.use("/api/wishlist", wishlist);
  app.use("/api/admin", admin);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
