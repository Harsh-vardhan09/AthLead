import { compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { LoginVal } from "../utils/zodValidation.js";
import { User } from "../models/Users.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { v2 as cloudinary } from "cloudinary";
import { normalizeEmail } from "../utils/normalizeEmail.js";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

/**
 * Hash a raw token string with SHA-256.
 * We never store the raw JWT — only its hash.
 */
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Parse the JWT_EXPIRE env value (e.g. "7d", "24h") into milliseconds
 * so we can set `expiresAt` on the stored document.
 */
const parseExpiry = (value) => {
  const match = value.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return num * multipliers[unit];
};

//login Auth
export const LoginAuth = async (req, res) => {
  const result = LoginVal.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.format(),
    });
  }

  const { email, password } = result.data;
  const normalizedEmail = normalizeEmail(email);
  try {
    const user = await User.findOne({ email: normalizedEmail }).select(
  "+password",
);
    if (!user) {
      return res.json({
        success: false,
        message: "No User with this mail",
      });
    }
    if (!compareSync(password, user.password)) {
      return res.json({
        success: false,
        message: "Wrong password",
      });
    }

    const { token: refreshToken, jti } = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    // Store a hashed identifier for the refresh token server-side
    const family = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + parseExpiry(process.env.JWT_EXPIRE),
    );

    await RefreshToken.create({
      tokenHash: hashToken(refreshToken),
      user: user._id,
      family,
      expiresAt,
    });

    const option = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    };

    res.cookie("refreshToken", refreshToken, option).json({
      success: true,
      message: "user Logged in",
      accessToken,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const refesh = async (req, res) => {
  const token = req.cookies.refreshToken;

  try {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "token not present",
      });
    }

    // Verify using the dedicated refresh-token secret
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "invalid token",
      });
    }

    // Look up the hashed token in the database
    const tokenHash = hashToken(token);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    // Token not found in DB — it was already rotated or never existed
    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "invalid token",
      });
    }

    // REUSE DETECTION: a revoked token is being replayed!
    // This means an attacker is using a previously-rotated token.
    // Nuclear option: revoke the ENTIRE family to force re-login.
    if (storedToken.revoked) {
      await RefreshToken.updateMany(
        { family: storedToken.family },
        { $set: { revoked: true } },
      );
      // Clear the cookie so the legitimate user knows to re-login
      res.clearCookie("refreshToken");
      return res.status(401).json({
        success: false,
        message: "refresh token reuse detected — all sessions revoked",
      });
    }

    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // --- Rotate ---
    // 1. Revoke the old token
    storedToken.revoked = true;
    await storedToken.save();

    // 2. Issue a new refresh token in the SAME family
    const { token: newRefreshToken, jti } = user.generateRefreshToken();
    const expiresAt = new Date(
      Date.now() + parseExpiry(process.env.JWT_EXPIRE),
    );

    await RefreshToken.create({
      tokenHash: hashToken(newRefreshToken),
      user: user._id,
      family: storedToken.family,
      expiresAt,
    });

    // 3. Issue a new access token
    const newAccessToken = user.generateAccessToken();

    const option = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    };

    // Send the rotated refresh token as a cookie
    res.cookie("refreshToken", newRefreshToken, option).status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  try {
    // Revoke all refresh tokens for this user
    if (req.user && req.user._id) {
      await RefreshToken.updateMany(
        { user: req.user._id },
        { $set: { revoked: true } },
      );
    } else if (token) {
      // Fallback: if we at least have the cookie, revoke the whole family
      const tokenHash = hashToken(token);
      const storedToken = await RefreshToken.findOne({ tokenHash });
      if (storedToken) {
        await RefreshToken.updateMany(
          { family: storedToken.family },
          { $set: { revoked: true } },
        );
      }
    }
  } catch (error) {
    // Log but don't block the logout — clearing cookies is the minimum
    console.error("Error revoking refresh tokens during logout:", error);
  }

  res.clearCookie("refreshToken").json({
    success: true,
    message: "logged out",
  });
};

export const editUser = async (req, res) => {
  const { fullname, phone, address, DOB } = req.body;

  try {
    let imageUrl;

    if (req.file) {
      const profileUrl = await cloudinary.uploader.upload(req.file.path);
      imageUrl = profileUrl.url;
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        fullname,
        phone,
        state: address,
        DOB,
        ...(imageUrl && { image: imageUrl }),
      },
      { returnDocument: "after" },
    );

    res.json({
      success: true,
      message: "User Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findOne({ _id: userId }).select(
      "-password -createdAt -updatedAt -email",
    );
    console.log(user);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error,
    });
  }
};
