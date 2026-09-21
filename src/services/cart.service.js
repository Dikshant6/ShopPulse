import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

export const addToCart = async (userId, productId, quantity) => {
  try {
    const product = await Product.findOne({ productId });

    if (!product) {
      throw new Error("Product doesn't exists");
    }

    const isEnough = product.stock > quantity ? true : false;

    if (!isEnough) {
      throw new Error("Can't exceed from inventory stock");
    }

    const user = await Cart.findById({ userId });

    if (!user) {
      const newCart = new Cart({ userId, productId, quantity });
    }

    

  } catch (error) {
    throw error;
  }
};
