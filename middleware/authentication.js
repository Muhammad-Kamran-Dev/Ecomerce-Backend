const { ErrorHandler } = require("../utils/ErrorHandler");
const { catchAsyncErrors } = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const config = require("../config");
exports.isUserAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Login first to access this resource", 401));
  }

  const { id } = jwt.verify(token, config.jwtSecret);
  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  req.user = user;
  next();
});

exports.authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role ${req.user.role} is not allowed to access this resource `
        )
      );
    }
    next();
  };
