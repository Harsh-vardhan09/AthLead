import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true,unique:true },
    phone: { type: Number },
    gender: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String ,default:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw3k1c6JaNUexk2h38jFUHu4j3O73P8mgVkw&s'},
    state:{ type: String},
    role:{ type: String, enum: ["user", "admin"], default: "user" },
    DOB:{ type: Date },
  },
  { timestamps: true },
);

const ParticipationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
  },
  fullname: { type: String, required: true },
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
const Participation = mongoose.model("Participation", ParticipationSchema);


export  {User,Participation};
