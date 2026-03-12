import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes    from "./routes/auth.routes.js";
import oauthRoutes   from "./routes/oauth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes   from "./routes/order.routes.js";
import cmsRoutes     from "./routes/cms.routes.js";

import { errorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();

app.use(cors({
  origin: "https://baltico-frontend.vercel.app",
  credentials: true,
}));
// app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/auth",     oauthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/cms",      cmsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "BaltiCo API is running 🚀" });
});

// Global error handler
app.use(errorHandler);

export { app };
