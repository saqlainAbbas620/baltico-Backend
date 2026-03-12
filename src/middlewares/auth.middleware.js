import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Verify JWT access token from Authorization header, cookies.
export const verifyToken = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Access token required");
  }
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, "User not found");

  req.user = user;
  next();
});

// Admin-only guard (must come after verifyToken)
export const isAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    throw new ApiError(403, "Admin access required");
  }
  next();
};
