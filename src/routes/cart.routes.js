import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  HandleAddToCart,
  handleGetCart,
  handleUpdateCartItems,
  handleRemoveCartItem,
  handleClearCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", authenticate, handleGetCart);
router.post("/items", authenticate, HandleAddToCart);
router.patch("/items/:productId", authenticate, handleUpdateCartItems);
router.delete("/items/:productId", authenticate, handleRemoveCartItem);
router.delete("/", authenticate, handleClearCart);

export default router;