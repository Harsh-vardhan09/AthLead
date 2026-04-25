import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: Number },
    gender: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String,},
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

const UserEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number,required: true },
  gender: { type: String, required: true },
  DOB:{ type: Date, required: true },
});



UserSchema.methods.generateAccessToken = function(){
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

UserSchema.methods.generateRefreshToken=function(){
  return jwt.sign({id:this._id}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_EXPIRE})
}



const User = mongoose.model("User", UserSchema);
const UserEvent = mongoose.model("UserEvent", UserEventSchema);


export  {User,UserEvent};
