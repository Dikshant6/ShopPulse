import { Otp } from "../models/OnetimePassword.js";
import { generateOTP } from "../utils/otp.js";

export const createOtp = async (email, purpose) => {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const newOtp = await Otp.findOneAndUpdate(
    { email },
    {
      otp: code,
      purpose,
      expiresAt,
    },
    { upsert: true, new: true },
  );
  return newOtp;
};

export const verifyOtp = async (email, otp, purpose) => {
  const otpDoc = await Otp.findOne({ email }).lean();
  const currentTime = new Date();

  if (
    !otpDoc ||
    otpDoc.purpose !== purpose ||
    otpDoc.expiresAt < currentTime ||
    otpDoc.otp !== otp
  ) {
    console.error("otp verification failed!");
    return;
  }

  const deletedOtp = await Otp.findOneAndDelete({ email });
  return deletedOtp;
};
