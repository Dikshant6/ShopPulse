import {
  addToCart,
  getCart,
  updateCartItems,
  removeCartItem,
  clearCart,
} from "../services/cart.service.js";

export const HandleAddToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    const cart = await addToCart(userId, productId, quantity);

    return res.status(200).json({ message: "Product added to cart" });
  } catch (error) {
    console.error("error while adding product to cart ", error);
    return res.status(500).json({ message: error.message });
  }
};

export const handleGetCart = async (req, res) => {
  const isHtmlRequest = req.accepts(["html", "json"]) === "html";
  try {
    const userId = req.user._id;
    let cart;
    try {
      cart = await getCart(userId);
    } catch (err) {
      if (err.message === "Cart doesn't exists") {
        cart = { user: userId, items: [] };
      } else {
        throw err;
      }
    }

    if (isHtmlRequest) {
      return res.status(200).render("cart/index", {
        cart,
        user: req.user,
      });
    }

    return res.status(200).json({ message: "Cart products", cart });
  } catch (error) {
    console.error("error while fetching cart data: ", error);
    if (isHtmlRequest) {
      return res.status(500).render("cart/index", {
        cart: { items: [] },
        user: req.user,
        error: error.message,
      });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const handleUpdateCartItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await updateCartItems(userId, productId, quantity);
    return res.status(200).json({ message: "Cart quantity updated" }, cart);
  } catch (error) {
    console.error("Error while updating the the cart", error);
    return res.status(500).json({ message: error.message });
  }
};

export const handleRemoveCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const cart = await removeCartItem(userId, productId);
    return res
      .status(200)
      .json({ message: "product removed from the cart", cart });
  } catch (error) {
    console.error("Error while reomve the product from the cart", error);
    return res.status(500).json({ message: error.message });
  }
};

export const handleClearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await clearCart(userId);
    return res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (error) {
    console.error("Error while clearing cart:", error);
    return res.status(400).json({ message: error.message });
  }
};
