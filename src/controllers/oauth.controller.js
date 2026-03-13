import { User } from "../models/user.model.js";
import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail }   from "../config/nodemailer.js";
import { welcomeEmail } from "../utils/emailTemplates.js";
import bcrypt from "bcrypt";

// ── POST /api/auth/google ──────────────────────────────────────────────────────
// Accepts either:
//   { credential }  — ID token from One Tap (legacy / production)
//   { code }        — Authorization code from oauth2.initCodeClient popup (dev + prod)
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential, code } = req.body;

  if (!credential && !code) {
    throw new ApiError(400, "Google credential or authorization code is required");
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  // ── Step 1: Get the Google user payload ───────────────────────────────────
  let payload;

  if (credential) {
    // ── Path A: ID token (One Tap) — verify with tokeninfo ─────────────────
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
      throw new ApiError(500, "Failed to verify Google token");
    }

    if (payload.aud !== clientId) {
      throw new ApiError(401, "Token audience mismatch");
    }

  } else {
    // ── Path B: Authorization code — exchange for tokens ───────────────────
    if (!clientSecret) {
      throw new ApiError(500, "GOOGLE_CLIENT_SECRET is not set in backend .env");
    }

    let tokenRes;
    try {
      const params = new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  "postmessage",   // required for ux_mode:"popup"
        grant_type:    "authorization_code",
      });

      const r = await fetch("https://oauth2.googleapis.com/token", {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    params.toString(),
      });
      tokenRes = await r.json();

      if (!r.ok || tokenRes.error) {
        throw new ApiError(401, tokenRes.error_description || "Failed to exchange Google code");
      }
    } catch (err) {
      if (err.statusCode) throw err;
      throw new ApiError(500, "Google token exchange failed");
    }

    // Verify the returned ID token
    try {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenRes.id_token}`
      );
      payload = await verifyRes.json();
      if (!verifyRes.ok || payload.error) {
        throw new ApiError(401, "Failed to verify exchanged Google token");
      }
    } catch (err) {
      if (err.statusCode) throw err;
      throw new ApiError(500, "Google token verification failed");
    }
  }

  if (payload.email_verified !== "true" && payload.email_verified !== true) {
    throw new ApiError(401, "Google email is not verified");
  }

  const { email, name, picture, sub: googleId } = payload;
  if (!email) throw new ApiError(400, "Could not retrieve email from Google account");

  // ── Step 2: Find or create user ───────────────────────────────────────────
  let user      = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    const hashedPassword = await bcrypt.hash(
      googleId + (process.env.ACCESS_TOKEN_SECRET || "baltico"),
      10
    );
    user = await User.create({
      name:       name || email.split("@")[0],
      email,
      password:   hashedPassword,
      googleId,
      avatar:     picture || "",
      isAdmin:    false,
      isVerified: true,
    });
    isNewUser = true;

    sendEmail({
      to:      email,
      subject: "Welcome to BaltiCo",
      html:    welcomeEmail(user.name),
    }).catch(() => {});

  } else if (!user.googleId) {
    await User.findByIdAndUpdate(user._id, {
      googleId,
      avatar:     user.avatar || picture || "",
      isVerified: true,
    });
    user = await User.findById(user._id);
  }

  // ── Step 3: Generate tokens ───────────────────────────────────────────────
  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

  const IS_PROD = process.env.NODE_ENV === "production";

  // ── Step 4: Respond ───────────────────────────────────────────────────────
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
            phone:   user.phone   || "",
          },
        },
        isNewUser ? "Account created via Google" : "Logged in via Google"
      )
    );
});
