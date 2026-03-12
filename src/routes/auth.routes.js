import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  refreshAccessToken,
  logout,
  verifyEmail,
  resendVerification,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Public
router.post("/register",           register);
router.post("/login",              login);
router.post("/refresh",            refreshAccessToken);
router.get ("/verify-email",       verifyEmail);        // GET — clicked from email link
router.post("/resend-verification",resendVerification);

// Protected
router.get ("/me",      verifyToken, getMe);
router.put ("/profile", verifyToken, updateProfile);
router.post("/logout",  verifyToken, logout);

export default router;
