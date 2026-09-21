import { Cart } from "../models/Cart.js";
import { addToCart } from "../services/cart.service.js";

export const HandleAddToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    const cart = await addToCart(userId, productId, quantity);

    return res.status(200).json({ message: "Product added to cart" });
  } catch (error) {
    console.error("error while adding product to cart ", error);
    return res.status(500).json({ message: "Failed to add product in cart" });
  }
};
