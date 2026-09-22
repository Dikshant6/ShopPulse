import { getDashboardStats } from "../services/dashboard.service.js";

export const getDashboard = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.user._id);
    return res.status(200).render("layouts/dashboard", {
      user: req.user,
      stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard statistics: ", error);
    return res.status(500).render("layouts/dashboard", {
      user: req.user,
      stats: { cartItems: 0, wishlistItems: 0 },
      error: error.message,
    });
  }
};
