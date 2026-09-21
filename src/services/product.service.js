import { Product } from "../models/Product.js";

export const createProduct = async (productData) => {
  try {
    const product = new Product(productData);
    await product.save();

    return product;
  } catch (error) {
    throw error;
  }
};

export const getAllProducts = async () => {
  try {
    const products = await Product.find();
    return products;
  } catch (error) {
    throw error;
  }
};

export const getProductById = async (productId) => {
  try {
    const product = await Product.findById(productId);
    return product;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (productId, updateData) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      {
        new: true,
      },
    );
    return updatedProduct;
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);
    return deletedProduct;
  } catch (error) {
    throw error;
  }
};
