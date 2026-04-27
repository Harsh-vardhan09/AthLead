import bcrypt, { compareSync, hashSync } from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginVal, signupVal } from "../utils/zodValidation.js";
import { User } from "../models/Users.js";
import { success } from "zod";
import { v2 as cloudinary } from "cloudinary";

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
    return res.status(400).json({
      errors: result.error.format(),
    });
  }

  const { fullname, email, phone, gender, password } = result.data;
  const hashedPassword = hashSync(password, 10);

  const user = await User.create({
    fullname,
    email,
    phone,
    gender,
    password: hashedPassword,
  });

  res.json({
    success: true,
    message: "Sign Up Successful",
  });
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

  const user = await User.findOne({ email: email });
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
};

export const refesh = async (req, res) => {
  const token = req.cookies.refreshToken;
  console.log(token);

  if (!token) {
    return res.status(401).json({
      message: "token not present",
    });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded) {
    return res.status(401).json({
      message: "invalid token",
    });
  }
  const user = await User.findOne({ _id: decoded.id });
  console.log(user);

  const newAccessToken = user.generateAccessToken();

  res.json({
    accessToken: newAccessToken,
  });
};

export const logout = (req, res) => {
  res.clearCookie("accessToken").clearCookie("refreshToken");
  res.json({
    success: true,
    message: "logged out",
  });
};

export const editUser = async (req, res) => {
  const profilePicture = req.file.path;
  const { fullname, phone, address, DOB } = req.body;
  // console.log(req.user._id);
  console.log(DOB);
  
  try {
    const profileUrl = await cloudinary.uploader.upload(profilePicture);
     
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        fullname,
        phone,
        state: address,
        DOB:DOB,
        image: profileUrl.url,
      },
      { returnDocument: "after" },
    );

    console.log(user);
    
    res.json({
      success: true,
      message: "User Updated",
    });
  } catch (error) {
    console.log(error);
    res.json({
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
