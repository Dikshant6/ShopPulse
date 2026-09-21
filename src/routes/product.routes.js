import express from "express";
import {
  handleCreateProduct,
  handleDeleteProduct,
  handleGetAllProducts,
  handleGetProductById,
  handleUpdateProduct,
} from "../controllers/product.controller.js";
import { authenticate, authorize, resolveUser } from "../middleware/auth.middleware.js";
const router = express.Router();

router
  .route("/")
  .get(resolveUser, handleGetAllProducts)
  .post(authenticate, authorize("admin"), handleCreateProduct);

router
  .route("/:id")
  .get(resolveUser, handleGetProductById)
  .patch(authenticate, authorize("admin"), handleUpdateProduct)
  .delete(authenticate, authorize("admin"), handleDeleteProduct);

export default router;