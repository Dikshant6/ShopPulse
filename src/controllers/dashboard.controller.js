export const getDashboard = (req, res) => {
  res.status(200).render("layouts/dashboard", { user: req.user });
};
