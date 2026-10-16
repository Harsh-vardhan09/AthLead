import { compareSync, hashSync } from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { LoginVal } from "../utils/zodValidation.js";
import { User } from "../models/Users.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { v2 as cloudinary } from "cloudinary";
import { normalizeEmail } from "../utils/normalizeEmail.js";
import fs from "fs";
import {
  PASSWORD_ERROR_MESSAGE,
  isValidPassword,
} from "../utils/passwordValidation.js";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
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

    const family = crypto.randomUUID();
    const refreshToken = user.generateRefreshToken(family);
    const accessToken = user.generateAccessToken();

    const decoded = jwt.decode(refreshToken);
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const tokenHash = hashToken(refreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      family,
      revoked: false,
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
  const token = req.cookies?.refreshToken;

  try {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "token not present",
      });
    }

    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({
        success: false,
        message: "invalid token",
      });
    }

    const tokenHash = hashToken(token);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // Reuse detection: If an already-revoked refresh token is presented, revoke the entire family
    if (storedToken.revoked) {
      await RefreshToken.updateMany(
        { family: storedToken.family },
        { revoked: true },
      );
      res.clearCookie("refreshToken");
      return res.status(401).json({
        success: false,
        message: "Invalid or revoked refresh token",
      });
    }

    // Atomically claim the current token to prevent race conditions during rotation
    const claimedToken = await RefreshToken.findOneAndUpdate(
      { _id: storedToken._id, revoked: false },
      { $set: { revoked: true } },
      { new: true },
    );

    if (!claimedToken) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Rotate: Issue new refresh token within the same family
    const newRefreshToken = user.generateRefreshToken(storedToken.family);
    const newAccessToken = user.generateAccessToken();

    const newDecoded = jwt.decode(newRefreshToken);
    const newExpiresAt = newDecoded?.exp
      ? new Date(newDecoded.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newTokenHash = hashToken(newRefreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash: newTokenHash,
      family: storedToken.family,
      revoked: false,
      expiresAt: newExpiresAt,
    });

    const option = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    };

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
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      const storedToken = await RefreshToken.findOne({ tokenHash });
      if (storedToken) {
        await RefreshToken.updateMany(
          { family: storedToken.family },
          { revoked: true },
        );
      }
    } else if (req.user?._id) {
      await RefreshToken.updateMany({ user: req.user._id }, { revoked: true });
    }
  } catch (error) {
    console.error("Logout token revocation error:", error);
  }

  res.clearCookie("accessToken").clearCookie("refreshToken");
  res.json({
    success: true,
    message: "logged out",
  });
};

export const editUser = async (req, res) => {
  const { fullname, phone, address, DOB, password } = req.body;

  try {
    if (password !== undefined && !isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: PASSWORD_ERROR_MESSAGE,
      });
    }

    const updates = {};
    if (fullname !== undefined) updates.fullname = fullname;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.state = address;
    if (DOB !== undefined) updates.DOB = DOB;

    if (
      updates.phone !== undefined &&
      updates.phone !== null &&
      updates.phone !== ""
    ) {
      const digits = String(updates.phone).replace(/\D/g, "");
      if (digits.length !== 10) {
        return res.status(400).json({
          success: false,
          message: "Phone must be a 10-digit number",
        });
      }
    }

    let imageUrl;

    if (req.file) {
      const profileUrl = await cloudinary.uploader.upload(req.file.path);
      imageUrl = profileUrl.url;
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        ...updates,
        ...(password !== undefined && { password: hashSync(password, 10) }),
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
  } finally {
    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("Failed to delete temp file:", cleanupError);
        }
      }
    }
  }
};

export const getUser = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findOne({ _id: userId }).select(
      "-password -createdAt -updatedAt",
    );

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};
