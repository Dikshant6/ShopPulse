import { Cart } from "../models/Cart.js";
import { WishList } from "../models/Wishlist.js";

/**
 * Retrieves dashboard statistics for the authenticated user.
 * Calculates:
 *  - cartItems: total sum of all item quantities in the user's cart
 *  - wishlistItems: total number of products in the user's wishlist
 *
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @returns {Promise<{ cartItems: number, wishlistItems: number }>}
 */
export const getDashboardStats = async (userId) => {
  const [cart, wishlist] = await Promise.all([
    Cart.findOne({ user: userId }).select("items.quantity").lean(),
    WishList.findOne({ user: userId }).select("products").lean(),
  ]);

  const cartItems = cart?.items
    ? cart.items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
    : 0;

  const wishlistItems = wishlist?.products
    ? wishlist.products.length
    : 0;

  return {
    cartItems,
    wishlistItems,
  };
};
