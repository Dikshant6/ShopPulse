import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  handleAdminEditProduct,
  handleAdminNewProduct,
  handleAdminProducts,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/products", authenticate, authorize("admin"), handleAdminProducts);

router.get(
  "/products/new",
  authenticate,
  authorize("admin"),
  handleAdminNewProduct,
);

router.get(
  "/products/:id/edit",
  authenticate,
  authorize("admin"),
  handleAdminEditProduct,
);
export default router;
