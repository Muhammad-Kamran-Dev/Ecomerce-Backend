const express = require("express");
const {
  getAllProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteProductReview,
  getProductsCategories,
  priceInfo,
} = require("../controllers/productController");
const {
  isUserAuthenticated,
  authorizeRoles,
} = require("../middleware/authentication");

const router = express.Router();

//  Routes related to products
router
  .route("/")
  .get(getAllProducts)
  .post(isUserAuthenticated, authorizeRoles("admin"), createProduct);

// Routes related to reviews
router
  .route("/review")
  .put(isUserAuthenticated, createProductReview)
  .get(getProductReviews)
  .delete(deleteProductReview);

// Get all Categories
router.route("/categories").get(getProductsCategories);
router.route("/priceInfo").get(priceInfo);

//  Routes related to a specific product by ID
router
  .route("/:id")
  .get(getProduct)
  .put(isUserAuthenticated, authorizeRoles("admin"), updateProduct)
  .delete(isUserAuthenticated, authorizeRoles("admin"), deleteProduct);

module.exports = router;
