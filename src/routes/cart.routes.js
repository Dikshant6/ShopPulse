import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { HandleAddToCart } from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", authenticate);
router.post("/items", authenticate, HandleAddToCart);
router.patch("/items/:productId", authenticate);
router.delete("/items/:productId", authenticate);
router.delete("/", authenticate);

export default router;