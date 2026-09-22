import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  handleAddToWishlist,
  handleGetWishlist,
  handleRemoveFromWishlist,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.get("/", authenticate, handleGetWishlist);
router.post("/:productId", authenticate, handleAddToWishlist);
router.delete("/:productId", authenticate, handleRemoveFromWishlist);

export default router;
