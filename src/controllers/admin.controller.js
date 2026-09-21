import { Product } from "../models/Product.js";
import { getAllProducts, getProductById } from "../services/product.service.js";


export const handleAdminProducts = async(req, res) => {
    const products = await getAllProducts();
    return res.render("admin/products/index", {
        products
    })   
}

export const handleAdminNewProduct = async(req, res) => {
    return res.status(200).render("admin/products/new");
}

export const handleAdminEditProduct = async(req, res) => {
    try {
        const product = await getProductById(req.params.id);
        if (!product) {
            return res.status(404).redirect("/admin/products");
        }
        return res.status(200).render("admin/products/edit", { product });
    } catch (error) {
        return res.status(404).redirect("/admin/products");
    }
}