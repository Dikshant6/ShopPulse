import { Product } from "../models/Product.js";
import { WishList } from "../models/Wishlist.js";

export const addToWishlist = async (userId, productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product doesn't exist");
  }

  let wishlist = await WishList.findOne({ user: userId });

  if (!wishlist) {
    wishlist = new WishList({ user: userId, products: [productId] });
    await wishlist.save();
    return wishlist;
  }

  const alreadyExist = wishlist.products.some(
    (id) => id.toString() === productId,
  );

  if (alreadyExist) {
    throw new Error("Product is already in wishlist");
  }

  wishlist.products.push(productId);
  await wishlist.save();
  return wishlist;
};

export const getWishlist = async (userId) => {
  const wishlist = await WishList.findOne({ user: userId }).populate(
    "products",
  );

  if (!wishlist) {
    throw new Error("Wishlist doesn't exist");
  }

  return wishlist;
};

export const removeFromWishlist = async (userId, productId) => {
  const wishlist = await WishList.findOne({ user: userId });

  if (!wishlist) {
    throw new Error("Wishlist doesn't exist");
  }

  const productIndex = wishlist.products.findIndex(
    (id) => id.toString() === productId,
  );

  if (productIndex === -1) {
    throw new Error("Product is not in wishlist");
  }

  wishlist.products.splice(productIndex, 1);
  await wishlist.save();
  return wishlist;
};
