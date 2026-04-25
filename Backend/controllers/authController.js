import bcrypt, { compareSync, hashSync } from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginVal, signupVal } from "../utils/zodValidation.js";
import { User } from "../models/Users.js";

//Signup auth
export const SingupAuth = async (req, res) => {
  const result = signupVal.safeParse(req.body);
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
    return res.status(401).json({
      success: false,
      message: "No User with this mail",
    });
  }
  if (!compareSync(password, user.password)) {
    return res.status(401).json({
      success: false,
      message: "Wrong password",
    });
  }
 
  
  const refreshToken = user.generateRefreshToken();
  const accessToken = user.generateAccessToken();

   console.log(refreshToken);
   console.log(accessToken);
   
  const option = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  res
    .cookie("refreshToken", refreshToken, option)
    .cookie("accessToken", accessToken, option)
    .json({
      message: "user Logged in",
    });
};


export const refesh = async (req, res) => {
  const token = req.cookie.refreshToken;

  if (!token) {
    return res.status(401).json({
      message: "token not present",
    });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        message: "invalid token",
      });
    }

    const newAccessToken=user.generateAccessToken()
    console.log(newAccessToken);
    
    res.json({
      accessToken:newAccessToken
    })
  });
};


export const logout=(req,res)=>{
  res.clearCookie('accessToken').clearCookie('refreshToken')
  res.json({
    message:"logged out"
  })
}