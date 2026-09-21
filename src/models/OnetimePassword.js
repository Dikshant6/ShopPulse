import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    otp: {
      type: String,
      required: true,
      length: 6,
    },
    purpose: {
      type: String,
      enum: ["user-creation", "forgot-password"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export const Otp = mongoose.model("Otp", otpSchema);
