import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sport:{ type: String, required: true },
  description:{ type: String, required: true },
  level:{ type: String, required: true },
  prize:{ type: Number, required: true },
  location:{ type: String, required: true },
  date:{ type: Date, required: true },
  tags:{
    type: String,
    enum: ['Freestyle', 'national', 'Youth','singles','doubles'], // Allowed values
    default: 'youth'
  }
},{timestamps:true});

const Event = mongoose.model("Event", EventSchema);

export default Event;
