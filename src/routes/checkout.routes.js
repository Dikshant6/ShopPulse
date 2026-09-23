import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { handleGetCheckout } from "../controllers/checkout.controller.js";

const router = express.Router();

router.get("/", authenticate, handleGetCheckout);

export default router;
