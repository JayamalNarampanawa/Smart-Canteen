import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import canteenRoutes from "./routes/canteenRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import ratingsRoutes from "./routes/ratingsRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/canteen", canteenRoutes);
  app.use("/api/menu", menuRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/ratings", ratingsRoutes);
  app.use("/api/users", usersRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

