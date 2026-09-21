import {
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createProduct,
} from "../services/product.service.js";

export const handleCreateProduct = async (req, res) => {
  try {
    const product = await createProduct(req.body);

    return res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Error while creating the product");
    return res.status(500).json({ message: error.message });
  }
};

export const handleGetAllProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    return res.status(200).render("products/index", {
      products: products || [],
    });
  } catch (error) {
    console.error("Error while getting all products", error);
    return res.status(500).json({
      message: "An error occurred while fetching products",
    });
  }
};

export const handleGetProductById = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "product not found",
      });
    }

    return res.status(200).render("products/details", {
      product,
    });
  } catch (error) {
    console.error("Error while getting product", error);
    if (error.name === "CastError") {
      return res.status(404).json({
        message: "product not found",
      });
    }
    return res.status(500).json({
      message: "An error occurred while fetching the product",
    });
  }
};

export const handleUpdateProduct = async (req, res) => {
  try {
    const updatedProduct = await updateProduct(req.params.id, req.body);

    if (!updatedProduct) {
      return res.status(404).json({
        message: "product not found",
      });
    }

    return res.status(200).json({
      message: "product updated successfully",
      updatedProduct,
    });
  } catch (error) {
    console.error("Error while updating the product", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const handleDeleteProduct = async (req, res) => {
  try {
    const deletedProduct = await deleteProduct(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product deleted sucessfully",
    });
  } catch (error) {
    console.error("Error while deleting the product", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
