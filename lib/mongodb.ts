import mongoose from "mongoose";

export const connectToDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) throw new Error("Please define MONGODB_URI in .env");

  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(uri, {
    dbName: "parking_db",
  });

  console.log("MongoDB connected");
};
