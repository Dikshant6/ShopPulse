import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

export const addToCart = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product doesn't exists");
  }

  const userCart = await Cart.findOne({ user: userId });

  if (!userCart) {
    if (quantity > product.stock) {
      throw new Error("Product limit reached");
    }
    const newCart = new Cart({
      user: userId,
      items: [
        {
          product: productId,
          quantity,
        },
      ],
    });
    await newCart.save();
    return newCart;
  }

  const item = userCart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (!item) {
    if (quantity > product.stock) {
      throw new Error("Can't exceed the limit");
    }
    userCart.items.push({ product: productId, quantity });
  } else {
    const totalQuantity = item.quantity + quantity;
    if (totalQuantity > product.stock) {
      throw new Error("Product limit reached");
    }

    item.quantity = totalQuantity;
  }
  await userCart.save();

  return userCart;
};

export const getCart = async (userId) => {
  const userCart = await Cart.findOne({ user: userId }).populate(
    "items.product",
  );

  if (!userCart) {
    throw new Error("Cart doesn't exists");
  }
  return userCart;
};

export const updateCartItems = async (userId, productId, quantity) => {
  const userCart = await Cart.findOne({ user: userId });

  if (!userCart) {
    throw new Error("Add a product to cart first");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product doesn't exist");
  }

  const item = userCart.items.find((item) => {
    return item.product.toString() === productId;
  });

  if (!item) {
    throw new Error("Please add a product first");
  }

  const inventoryStock = product.stock;

  if (quantity > inventoryStock) {
    throw new Error("Can't exceed the product limit");
  } else if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  item.quantity = quantity;
  await userCart.save();

  return userCart;
};

export const removeCartItem = async (userId, productId) => {
  const userCart =  await Cart.findOne({ user: userId });

  const itemIndex = userCart.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (itemIndex === -1) {
    throw new Error("Product is not in the cart");
  }

  userCart.items.splice(itemIndex, 1);
  await userCart.save();
  return userCart;
};

export const clearCart = async (userId) => {
  const userCart = await Cart.findOne({ user: userId });

  if (!userCart) {
    throw new Error("Cart doesn't exist");
  }

  userCart.items = [];

  await userCart.save();

  return userCart;
};
