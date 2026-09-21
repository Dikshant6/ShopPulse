import JWT from "jsonwebtoken";
import { User } from "../models/User.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Please login first" });
    }

    const decodedPayload = JWT.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedPayload.userId);

    if (!user) {
      return res.status(401).render("auth/register",{ message: "User not found" });
    }

    req.user = user;
    res.locals.user = user;
    next();

  } catch (error) {
    console.error("Authentication error: ", error);
    return res.status(401).render("auth/login",{ message: "Invalid or expired token" });
  }
};

export const resolveUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.locals.user = null;
      return next();
    }

    const decodedPayload = JWT.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedPayload.userId).select("-password");

    if (user) {
      req.user = user;
      res.locals.user = user;
    } else {
      res.locals.user = null;
    }
  } catch (error) {
    res.locals.user = null;
  }
  next();
};

export const redirectAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return next();
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next();
    }

    return res.redirect("/dashboard");
  } catch (error) {
    return next();
  }
};

export const authorize = (requiredRole) => {
  return (req, res, next) => {
    const { role } = req.user;

    if (role !== requiredRole) {
      return res.status(403).json({
        message: "Unauthorised access denied",
      });
    }
    next();
  };
};
