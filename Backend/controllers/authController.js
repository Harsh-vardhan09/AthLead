import { compareSync, hashSync } from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginVal, signupVal } from "../utils/zodValidation.js";
import { User } from "../models/Users.js";
import { v2 as cloudinary } from "cloudinary";
import { normalizeEmail } from "../utils/normalizeEmail.js";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

//Signup auth
export const SingupAuth = async (req, res) => {
  const result = signupVal.safeParse(req.body);
  console.log(req.body);
  console.log(result);

  if (!result.success) {
    return res.json({
      errors: result.error.format(),
    });
  }

  const { fullname, email, phone, gender, password, DOB } = result.data;
  const hashedPassword = hashSync(password, 10);
  const normalizedEmail = normalizeEmail(email);

  try {
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    await User.create({
      fullname,
      email: normalizedEmail,
      phone,
      gender,
      password: hashedPassword,
      DOB,
    });

    res.json({
      success: true,
      message: "Sign Up Successful",
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
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
    const user = await User.findOne({ email: normalizedEmail });
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

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    //  console.log(refreshToken);
    //  console.log(accessToken);

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
  // console.log(token);

  try {
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "token not present",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "invalid token",
      });
    }
    const user = await User.findOne({ _id: decoded.id });
    // console.log(user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const newAccessToken = user.generateAccessToken();

    res.status(200).json({
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

export const logout = (req, res) => {
  res.clearCookie("accessToken").clearCookie("refreshToken");
  res.json({
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
      "-password -createdAt -updatedAt -role -email",
    );
    // console.log(user);

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
