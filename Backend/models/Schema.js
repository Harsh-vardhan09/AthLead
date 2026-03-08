import {mongoose,Schema} from "mongoose";


const UserSchema=new Schema({
    Username:String,
    Password:{
        type:String,
        required:true
    }
})
