const express = require("express");
const {
  loginUser,
  getUserProfile,
  getUser,
  deleteUser,
  LogoutUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateCurrentUser,
  deleteCurrentUser,
  updateUser,
  updateCurrentUserPassword,
  signupUser,
} = require("../controllers/userController");
const {
  isUserAuthenticated,
  authorizeRoles,
} = require("../middleware/authentication");

const router = express.Router();

// Authentication routes
router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);
router.route("/logout").delete(LogoutUser);

// Password reset routes
router.route("/password/forgot").put(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);

// User profile routes
router
  .route("/me")
  .get(isUserAuthenticated, getUserProfile)
  .patch(isUserAuthenticated, updateCurrentUser)
  .post(isUserAuthenticated, updateCurrentUserPassword)
  .delete(isUserAuthenticated, deleteCurrentUser);

// User CRUD routes
router
  .route("/:id")
  .get(isUserAuthenticated, authorizeRoles("admin"), getUser)
  .patch(isUserAuthenticated, authorizeRoles("admin"), updateUser)
  .delete(isUserAuthenticated, authorizeRoles("admin"), deleteUser);

// Route to get all users
router
  .route("/")
  .get(isUserAuthenticated, authorizeRoles("admin"), getAllUsers);

module.exports = router;
