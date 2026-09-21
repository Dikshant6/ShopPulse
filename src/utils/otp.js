import crypto from "crypto";

export const generateOTP = () => {
  let otp = crypto.randomInt(111111, 999999);
  return String(otp);
};


