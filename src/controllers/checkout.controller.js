import { getCart } from "../services/cart.service.js";

export const handleGetCheckout = async (req, res) => {
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

    return res.status(200).render("checkout/index", {
      cart: cart || { items: [] },
      user: req.user,
    });
  } catch (error) {
    console.error("Error while fetching checkout data: ", error);
    return res.status(500).render("checkout/index", {
      cart: { items: [] },
      user: req.user,
      error: error.message,
    });
  }
};
