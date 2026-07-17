import mongoose from "mongoose";

const db = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    console.error("Ensure MongoDB is running on:", process.env.MONGODB_URI);
    process.exit(1);
  }
};

export default db;
