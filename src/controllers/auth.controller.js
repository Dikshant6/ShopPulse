import { createUser, loginUser } from "../services/auth.service.js";
import { createOtp, verifyOtp } from "../services/otp.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import { User } from "../models/User.js";

import JWT from "jsonwebtoken";

export const getRegisterPage = (req, res) => {
  const token = req.cookies && req.cookies["otp-token"];
  if (token) {
    try {
      const decoded = JWT.verify(token, process.env.JWT_SECRET);
      if (decoded.purpose === "email-verification") {
        return res.render("auth/register", {
          step: "details",
          email: decoded.email,
        });
      }
    } catch (err) {
      // Expired or invalid token, proceed with email step
    }
  }
  return res.render("auth/register", { step: "email" });
};

export const getLoginPage = (req, res) => {
  res.render("auth/login");
};

export const handleCreateUser = async (req, res) => {
  let decoded;
  try {
    const { username, password } = req.body;
    const token = req.cookies && req.cookies["otp-token"];

    if (!token) {
      return res.status(401).render("auth/register", {
        step: "email",
        message: "Please verify your email first",
      });
    }

    try {
      decoded = JWT.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).render("auth/register", {
        step: "email",
        message: "Verification session expired. Please verify your email again.",
      });
    }

    if (decoded.purpose !== "email-verification") {
      return res.status(401).render("auth/register", {
        step: "email",
        message: "Invalid verification token",
      });
    }

    await createUser({
      username,
      email: decoded.email,
      password,
    });

    res.clearCookie("otp-token");
    return res.status(201).redirect("/auth/login");
  } catch (error) {
    console.error("error occurred while signing up user", error);
    return res.status(500).render("auth/register", {
      step: "details",
      email: decoded?.email,
      message: error.message,
    });
  }
};

export const handleUserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser({ email, password });

    const token = JWT.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.status(200).redirect("/dashboard");
  } catch (error) {
    console.error("Error occured while login", error);
    return res.status(500).render("auth/login", { message: error.message });
  }
};

export const handleLogout = (req, res) => {
  res.clearCookie("token");
  return res.redirect("/auth/login");
};

export const requestOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    // Check whether a user with that email already exists before sending a signup OTP
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render("auth/register", {
        step: "email",
        email,
        message: "An account with this email already exists",
      });
    }

    const purpose = "user-creation";
    const otpDoc = await createOtp(email, purpose);
    await sendOtpEmail(email, otpDoc.otp);

    return res.status(200).render("auth/register", {
      step: "otp",
      email,
    });
  } catch (error) {
    console.error("error while sending otp:", error);
    return res.status(502).render("auth/register", {
      step: "email",
      email: req.body.email || "",
      message: "Failed to send verification code. Please try again.",
    });
  }
};

export const otpVerification = async (req, res) => {
  try {
    const { email, userOtp } = req.body;
    const verifiedOtp = await verifyOtp(email, userOtp?.trim(), "user-creation");

    if (!verifiedOtp) {
      return res.status(400).render("auth/register", {
        step: "otp",
        email,
        message: "Invalid or expired verification code",
      });
    }

    const payload = {
      email,
      purpose: "email-verification",
    };

    const token = JWT.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    res.cookie("otp-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60 * 1000,
    });

    return res.status(200).render("auth/register", {
      step: "details",
      email,
    });
  } catch (error) {
    console.error("Error while verifying OTP", error);
    return res.status(500).render("auth/register", {
      step: "otp",
      email: req.body.email,
      message: "Verification failed. Please try again.",
    });
  }
};
