const express = require("express");
const {
  isUserAuthenticated,
  authorizeRoles,
} = require("../middleware/authentication");

const {
  createOrder,
  getSingleOrder,
  getMyOrders,
  getAllOrders,
  updateOrder,
  cancelOrder,
  updateMyOrder,
  cancelMyOrder,
  updateStatus,
} = require("../controllers/orderController");

const router = express.Router();

// Routes related to orders
router
  .route("/")
  .post(isUserAuthenticated, createOrder)
  .get(isUserAuthenticated, authorizeRoles("admin"), getAllOrders);

// Routes for user-specific orders
router.route("/me").get(isUserAuthenticated, getMyOrders);
router
  .route("/me/:id")
  .patch(isUserAuthenticated, updateMyOrder)
  .delete(isUserAuthenticated, cancelMyOrder);

// Routes for admin-specific orders
router
  .route("/admin/:id")
  .get(isUserAuthenticated, authorizeRoles("admin"), getSingleOrder)
  .put(isUserAuthenticated, authorizeRoles("admin"), updateOrder)
  .patch(isUserAuthenticated, authorizeRoles("admin"), updateStatus)
  .delete(isUserAuthenticated, authorizeRoles("admin"), cancelOrder);

module.exports = router;
