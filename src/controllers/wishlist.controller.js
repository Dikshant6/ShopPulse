import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../services/wishlist.service.js";

export const handleAddToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const wishlist = await addToWishlist(userId, productId);
    return res
      .status(200)
      .json({ message: "Product added to wishlist", wishlist });
  } catch (error) {
    console.error("error while adding product to wishlist", error);
    return res.status(400).json({ message: error.message });
  }
};

export const handleGetWishlist = async (req, res) => {
  const isHtmlRequest = req.accepts(["html", "json"]) === "html";
  try {
    const userId = req.user._id;
    let wishlist;
    try {
      wishlist = await getWishlist(userId);
    } catch (err) {
      if (err.message === "Wishlist doesn't exist") {
        wishlist = { user: userId, products: [] };
      } else {
        throw err;
      }
    }

    if (isHtmlRequest) {
      return res.status(200).render("wishlist/index", {
        wishlist,
        user: req.user,
      });
    }

    return res.status(200).json({ message: "Wishlist products", wishlist });
  } catch (error) {
    console.error("error while fetching wishlist", error);
    if (isHtmlRequest) {
      return res.status(500).render("wishlist/index", {
        wishlist: { products: [] },
        user: req.user,
        error: error.message,
      });
    }
    return res.status(400).json({ message: error.message });
  }
};

export const handleRemoveFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const wishlist = await removeFromWishlist(userId, productId);
    return res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("error while removing product from wishlist");
    return res.status(400).json({ message: error.message });
  }
};
