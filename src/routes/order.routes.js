import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  handleCreateOrder,
  handleGetUserOrders,
  handleGetOrderById,
  handleOrderCancellation,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", authenticate, handleCreateOrder);
router.get("/", authenticate, handleGetUserOrders);
router.get("/:orderId", authenticate, handleGetOrderById);
router.delete("/:orderId", authenticate, handleOrderCancellation);

export default router;
