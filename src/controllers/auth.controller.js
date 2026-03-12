import crypto from "crypto";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../config/nodemailer.js";
import { verificationEmail, welcomeEmail } from "../utils/emailTemplates.js";
import jwt from "jsonwebtoken";

// ── Helper: generate both tokens and save refresh to DB ───────────────────────
const generateTokens = async (user) => {
  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await User.updateOne({ _id: user._id }, { $set: { refreshToken } });
  return { accessToken, refreshToken };
};

// ── Helper: set refresh cookie ────────────────────────────────────────────────
const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
};

// ── Internal helper ───────────────────────────────────────────────────────────
async function resendVerificationLink(user) {
  const rawToken    = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  await User.updateOne({ _id: user._id }, {
    emailVerificationToken:  hashedToken,
    emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const backendUrl = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}/api`}`;
  const verifyUrl  = `${backendUrl}/auth/verify-email?token=${rawToken}&id=${user._id}`;
  await sendEmail({
    to:      user.email,
    subject: "Verify your BaltiCo account",
    html:    verificationEmail(user.name, verifyUrl),
  });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    // If they registered but never verified, resend the link
    if (!exists.isVerified) {
      await resendVerificationLink(exists);
      return res.status(200).json(
        new ApiResponse(200, { requiresVerification: true },
          "Account already exists but is unverified. A new verification email has been sent.")
      );
    }
    throw new ApiError(409, "Email already registered");
  }

  // Generate secure verification token
  const rawToken    = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    isVerified: false,
    emailVerificationToken:  hashedToken,
    emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  });

  // Send verification email
  // Link points to the BACKEND verify endpoint which redirects to frontend after verifying
  const backendUrl = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}/api`}`;
  const verifyUrl  = `${backendUrl}/auth/verify-email?token=${rawToken}&id=${user._id}`;
  try {
    await sendEmail({
      to:      user.email,
      subject: "Verify your BaltiCo account",
      html:    verificationEmail(name, verifyUrl),   // use name from req.body — guaranteed defined
    });
  } catch (emailErr) {
    await User.findByIdAndDelete(user._id);
    console.error("Error sending verification email:", emailErr.message);
    throw new ApiError(500,
      "Failed to send verification email — check EMAIL and EMAIL_PASS in .env. " +
      "You must use a Gmail App Password (not your normal password). " +
      "Generate one at: https://myaccount.google.com/apppasswords"
    );
  }

  res.status(201).json(
    new ApiResponse(201, { requiresVerification: true, email: user.email },
      "Account created! Please check your email to verify your account before signing in.")
  );
});

// ── GET /api/auth/verify-email ────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token, id } = req.query;

  if (!token || !id) throw new ApiError(400, "Invalid verification link");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Select ALL needed fields explicitly — without this, name/email/isAdmin are undefined
  const user = await User.findOne({
    _id: id,
    emailVerificationToken:  hashedToken,
    emailVerificationExpiry: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpiry +refreshToken");

  if (!user) {
    // Redirect to frontend with a clear error instead of throwing JSON
    return res.redirect(
      `${process.env.FRONTEND_URL}?verified=false&error=${encodeURIComponent("Verification link is invalid or has expired. Please request a new one.")}`
    );
  }

  // Mark as verified and clear token
  await User.updateOne({ _id: user._id }, {
    $set:   { isVerified: true },
    $unset: { emailVerificationToken: "", emailVerificationExpiry: "" },
  });

  // Send welcome email (non-blocking)
  sendEmail({
    to:      user.email,
    subject: "Welcome to Lumière",
    html:    welcomeEmail(user.name),
  }).catch(() => {});

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  setRefreshCookie(res, refreshToken);

  // Redirect to frontend — pass everything App.jsx needs to auto-login
  return res.redirect(
    `${process.env.FRONTEND_URL}` +
    `?verified=true` +
    `&token=${accessToken}` +
    `&name=${encodeURIComponent(user.name || "")}` +
    `&email=${encodeURIComponent(user.email || "")}` +
    `&isAdmin=${user.isAdmin || false}` +
    `&id=${user._id}`
  );
});

// ── POST /api/auth/resend-verification ────────────────────────────────────────
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+emailVerificationToken +emailVerificationExpiry");

  if (!user)            throw new ApiError(404, "No account found with that email");
  if (user.isVerified)  throw new ApiError(400, "Email is already verified");

  await resendVerificationLink(user);

  res.json(new ApiResponse(200, {}, "Verification email resent. Please check your inbox."));
});



// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password required");

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) throw new ApiError(401, "Invalid email or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  // Block login if email not verified
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before signing in. Check your inbox for the verification link.");
  }

  const { accessToken, refreshToken } = await generateTokens(user);
  setRefreshCookie(res, refreshToken);

  res.json(
    new ApiResponse(200, {
      token: accessToken,
      user: {
        id:      user._id,
        name:    user.name,
        email:   user.email,
        isAdmin: user.isAdmin,
        address: user.address,
        phone:   user.phone,
      },
    }, "Login successful")
  );
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  res.json(
    new ApiResponse(200, {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        address: req.user.address,
        phone: req.user.phone,
      },
    })
  );
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { address, phone, password } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (address !== undefined) user.address  = address;
  if (phone !== undefined) user.phone  = phone;
  if (password) user.password = password;

  await user.save();

  res.json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        address: user.address,
        phone: user.phone,
      },
    }, "Profile updated")
  );
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token required");

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const user    = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const accessToken = user.generateAccessToken();
  res.json(new ApiResponse(200, { token: accessToken }, "Token refreshed"));
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.clearCookie("refreshToken").json(new ApiResponse(200, {}, "Logged out successfully"));
});
