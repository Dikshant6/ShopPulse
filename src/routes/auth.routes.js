import express from "express";
import {
  getLoginPage,
  getRegisterPage,
  handleCreateUser,
  handleLogout,
  handleUserLogin,
  requestOtp,
  otpVerification,
} from "../controllers/auth.controller.js";

import {
  validateRegister,
  validateLogin,
} from "../validators/auth.validator.js";
import { redirectAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/register")
  .get(redirectAuthenticated, getRegisterPage)
  .post(validateRegister, handleCreateUser);

router
  .route("/login")
  .get(redirectAuthenticated, getLoginPage)
  .post(validateLogin, handleUserLogin);

router.post(
  "/register/request-otp",
  validateRegister,
  requestOtp
);

router.post(
  "/register/verify-otp",
  otpVerification
);

router.get("/logout", handleLogout);

export default router;
