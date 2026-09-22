import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

export const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const html = await ejs.renderFile(
    path.resolve("src/views/templates/otpEmail.ejs"),
    { otp, expiryMinutes: 5, year: new Date().getFullYear() },
  );

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "ShopPulse Email Verification",
    text: `Your OTP is ${otp}`,
    html,
  });
};
