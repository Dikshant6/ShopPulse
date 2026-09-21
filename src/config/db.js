import mongoose from "mongoose";

export const connectToDB = async (DB_URI) => {
  try {
    await mongoose.connect(DB_URI, {
        dbName: "E-Commerce",
    });
    console.log("Database is succesfully connected!");
  } catch (error) {
    console.error("Database connection error", error);
  }
};
