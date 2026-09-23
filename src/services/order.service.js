import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

export const createOrder = async (userId, shippingAddress) => {
  // 1. Get user's cart
  const userCart = await Cart.findOne({ user: userId });

  if (!userCart) {
    throw new Error("User cart is not found");
  }

  if (userCart.items.length === 0) {
    throw new Error("Please add a product to purchase");
  }

  // 2. Get all products from cart
  const productIds = userCart.items.map((item) => item.product);

  const products = await Product.find({
    _id: { $in: productIds },
  });

  // 3. Create order item snapshots
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of userCart.items) {
    const product = products.find(
      (product) => product._id.toString() === cartItem.product.toString(),
    );

    if (!product) {
      throw new Error("Product no longer exists");
    }

    // 4. Check stock
    if (cartItem.quantity > product.stock) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const itemSubtotal = product.price * cartItem.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: cartItem.quantity,
      subtotal: itemSubtotal,
    });

    subtotal += itemSubtotal;
  }

  // 5. Calculate shipping
  const shippingFee = subtotal >= 1000 ? 0 : 50;

  // 6. Calculate final amount
  const totalAmount = subtotal + shippingFee;

  // 7. Create order
  const order = new Order({
    user: userId,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingFee,
    totalAmount,
  });

  await order.save();

  // 8. Reduce product stock
  for (const cartItem of userCart.items) {
    await Product.findByIdAndUpdate(cartItem.product, {
      $inc: {
        stock: -cartItem.quantity,
      },
    });
  }

  // 9. Clear cart
  userCart.items = [];
  await userCart.save();

  return order;
};

export const getUserOrders = async (userId) => {
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  if (!orders) {
    throw new Error("Please add something in the cart");
  }
  return orders;
};

export const getOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) {
    throw new Error("Order not found");
  }
  return order;
};

export const cancelOrder = async (userId, orderId) => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.orderStatus !== "pending" && order.orderStatus !== "confirmed") {
    throw new Error("Can't cancel your order now");
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        stock: item.quantity,
      },
    });
  }

  order.orderStatus = "cancelled";

  await order.save();

  return order;
};
