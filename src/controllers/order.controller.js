import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from "../services/order.service.js";

export const handleCreateOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress } = req.body;
    const order = await createOrder(userId, shippingAddress);

    return res
      .status(201)
      .json({ message: "order placed successfully", order });
  } catch (error) {
    console.error("Error while creating a order", error);
    return res.status(400).json({ message: error.message });
  }
};

export const handleGetUserOrders = async (req, res) => {
  const isHtmlRequest = req.accepts(["html", "json"]) === "html";
  try {
    const userId = req.user._id;
    let orders = [];
    try {
      orders = await getUserOrders(userId);
    } catch (err) {
      if (err.message === "Please add something in the cart") {
        orders = [];
      } else {
        throw err;
      }
    }

    if (isHtmlRequest) {
      return res.status(200).render("orders/index", {
        orders: orders || [],
        user: req.user,
      });
    }

    return res.status(200).json({
      message: "User orders fetched successfully",
      orders: orders || [],
    });
  } catch (error) {
    console.error("Error while fetching user orders: ", error);
    if (isHtmlRequest) {
      return res.status(500).render("orders/index", {
        orders: [],
        user: req.user,
        error: error.message,
      });
    }
    return res.status(400).json({ message: error.message });
  }
};

export const handleGetOrderById = async (req, res) => {
  const isHtmlRequest = req.accepts(["html", "json"]) === "html";
  try {
    const userId = req.user._id;
    const orderId = req.params.orderId || req.params;
    const order = await getOrderById(userId, orderId);

    if (isHtmlRequest) {
      return res.status(200).render("orders/details", {
        order,
        user: req.user,
        orderId: typeof orderId === "string" ? orderId : req.params.orderId,
      });
    }

    return res
      .status(200)
      .json({ message: "Order fetched sucessfully", order });
  } catch (error) {
    console.error("Order not found: ", error);
    if (isHtmlRequest) {
      return res.status(404).render("orders/details", {
        order: null,
        user: req.user,
        orderId: req.params.orderId,
        error: error.message,
      });
    }
    return res.status(400).json({ message: error.message });
  }
};

export const handleOrderCancellation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await cancelOrder(userId, orderId);
    return res
      .status(200)
      .json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Error while cancelling the product", error);
    return res.status(400).json({ message: error.message });
  }
};
