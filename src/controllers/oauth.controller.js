import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../config/nodemailer.js";
import { welcomeEmail } from "../utils/emailTemplates.js";
import bcrypt from "bcrypt";

// ── POST /api/auth/google ─────────────────────────────────────────────────────
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new ApiError(400, "Google credential (ID token) is required");
  }

  // ── Step 1: Verify the Google ID token with Google's tokeninfo endpoint ─────
  let payload;
  try {
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    payload = await googleRes.json();

    if (!googleRes.ok || payload.error) {
      throw new ApiError(401, payload.error_description || "Invalid Google token");
    }
  } catch (err) {
    if (err.statusCode) throw err;
    throw new ApiError(500, "Failed to verify Google token with Google servers");
  }

  // Validate audience matches our client ID
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (payload.aud !== clientId) {
    throw new ApiError(401, `Token audience mismatch. Expected: ${clientId}, Got: ${payload.aud}`);
  }

  if (payload.email_verified !== "true" && payload.email_verified !== true) {
    throw new ApiError(401, "Google email is not verified");
  }

  const { email, name, picture, sub: googleId } = payload;
  if (!email) throw new ApiError(400, "Could not retrieve email from Google account");

  // ── Step 2: Find or create user ─────────────────────────────────────────────
  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    // Create new Google user — bypass the bcrypt pre-save hook for password
    // by pre-hashing it ourselves (avoids minlength validator on raw value)
    const hashedPassword = await bcrypt.hash(googleId + process.env.ACCESS_TOKEN_SECRET, 10);

    user = await User.create({
      name:       name || email.split("@")[0],
      email,
      password:   hashedPassword,
      googleId,
      avatar:     picture || "",
      isAdmin:    false,
      isVerified: true,   // Google has already verified the email
    });
    isNewUser = true;

    sendEmail({
      to: email,
      subject: "Welcome to Lumière",
      html: welcomeEmail(user.name),
    }).catch(() => {});

  } else if (!user.googleId) {
    // Link Google account to existing email/password user
    await User.findByIdAndUpdate(user._id, {
      googleId,
      avatar:     user.avatar || picture || "",
      isVerified: true,   // trust Google's verification
    });
    user = await User.findById(user._id); // re-fetch with updates
  }

  // ── Step 3: Generate tokens using findByIdAndUpdate to avoid pre-save hook ──
  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Use updateOne to save refreshToken — bypasses pre-save hook entirely
  await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

  const IS_PROD = process.env.NODE_ENV === "production";

  // ── Step 4: Respond ──────────────────────────────────────────────────────────
  res
    .status(isNewUser ? 201 : 200)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure:   IS_PROD,
      sameSite: IS_PROD ? "none" : "lax",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(
        isNewUser ? 201 : 200,
        {
          token: accessToken,
          user: {
            id:      user._id,
            name:    user.name,
            email:   user.email,
            avatar:  user.avatar,
            isAdmin: user.isAdmin,
            address: user.address || "",
            phone:   user.phone || "",
          },
        },
        isNewUser ? "Account created via Google" : "Logged in via Google"
      )
    );
});
