import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// User — must be logged in
router.post("/",verifyToken, createOrder);
router.get ("/my", verifyToken,getMyOrders);

// Admin only
router.get ("/", verifyToken, isAdmin, getAllOrders);
router.put ("/:id/status", verifyToken, isAdmin, updateOrderStatus);

export default router;
