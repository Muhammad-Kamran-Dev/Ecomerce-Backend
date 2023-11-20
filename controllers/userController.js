const { catchAsyncErrors } = require("../middleware/catchAsyncError");
const { ErrorHandler } = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { checkMobileNumber } = require("../utils/formateMobileNumber");
const { clearCookie } = require("../utils/clearCookie");
const { uploadFile } = require("../utils/cloudinary/uploadFile");

// Post request to register user => /api/v1/users
exports.signupUser = catchAsyncErrors(async (req, res, next) => {
  const option = {
    folder: "avatar",
    width: 300,
    height: 300,
    crop: "scale",
  };

  const myCloud = await uploadFile(req.body.avatar, option, next);
  if (!myCloud) return;

  const { name, email, password, mobileNo } = req.body;

  if (!name || !email || !password)
    return next(new ErrorHandler("Please fill all the fields", 500));

  //Validate and format the mobile number if provided
  const formattedMobileNo = mobileNo ? checkMobileNumber(mobileNo, next) : "";
  const user = await User.create({
    name,
    email,
    password,
    mobileNo: formattedMobileNo,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendToken(user, 201, res);
});

// Post request to login user => /api/v1/users
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password is entered by user
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password", 400));
  }

  const userExist = await User.findOne({ email }).select("+password");
  if (!userExist) {
    return next(new ErrorHandler("Invalid Credentials", 404));
  }

  // Check if password is correct or not using the user model instance method comparePassword
  const isPasswordMatched = await userExist.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Credentials", 401));
  }

  sendToken(userExist, 200, res);
});

//Get user details on Id=> /api/v1/users/:id
exports.getUser = catchAsyncErrors(async (req, res, next) => {
  // get the user id from the params
  const { id } = req.params;
  const user = await User.findOne({ _id: id });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Get all users => /api/v1/users

exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ role: "user" });
  if (!users) {
    return next(new ErrorHandler("No user Exists", 404));
  }

  res.status(200).json({
    success: true,
    totalUsers: users.length,
    users,
  });
});
// Delete user => /api/v1/users/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const deletedUser = await User.findByIdAndDelete(id);
  clearCookie(res, "token");
  if (!deletedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(404).json({
    success: true,
    message: "User deleted successfully",
  });
});

//forgot password => /api/v1/users/forgotPassword

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const resetToken = user.getPasswordResetToken();
  user.save({ validateBeforeSave: false }); // save the user with the reset token and the reset token expire time in the database

  //   Configure nodemailer to send email to the user with the reset token and the reset url to reset the password
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/password/reset/${resetToken}`;
  const message = `Your password reset token is : ${resetToken} \n\nclick on the link below to reset your password \n\n${resetUrl}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Ecommerce Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

// Logout user => /api/v1/users/logout
exports.LogoutUser = catchAsyncErrors(async (req, res, next) => {
  //Remove the token from the cookie
  clearCookie(res, "token");

  if (!req.cookies.token) {
    return next(new ErrorHandler("Login First to Logout", 200));
  }

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

// Reset password => /api/v1/users/resetPassword/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) {
    return next(new ErrorHandler("Please enter password", 400));
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Password reset token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, res);
});

// Get user profile => /api/v1/users/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  // if the user is authenticated then the user id will be available in the req.user object
  const { id } = req.user;

  const user = await User.findById(id).select("-__v -_id");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update Current user profile => /api/v1/users/me
exports.updateCurrentUser = catchAsyncErrors(async (req, res, next) => {
  const { _id } = req.user;
  const { name, mobileNo, description } = req.body;

  if (!name || !mobileNo || !description) {
    return next(new ErrorHandler("Missing required field", 400));
  }

  const updatedName = name ? name : req.user.name;
  const updatedDescription = description ? description : req.user.description;

  //Validate and format the mobile number if provided
  const formattedMobileNo = mobileNo
    ? checkMobileNumber(mobileNo, next)
    : req.user.mobileNo;
  // if no mobile number is provided then the checkMobileNumber function will return undefined so we will not update the mobile number in the database and don't send the response as it is sent in the checkMobileNumber function

  if (!formattedMobileNo) {
    return new ErrorHandler("Please enter a valid mobile number", 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      name: updatedName,
      mobileNo: formattedMobileNo,
      description: updatedDescription,
    },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    updatedUser,
  });
});

// Delete Current user profile => /api/v1/users/me
exports.deleteCurrentUser = catchAsyncErrors(async (req, res, next) => {
  const { _id } = req.user;

  const deletedUser = await User.findByIdAndDelete(_id);

  if (!deletedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  //Remove the token from the cookie as well if the user is deleted
  clearCookie(res, "token");

  res.status(204).json({
    success: true,
  });
});

// Update user profile => /api/v1/users/:id
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const { _id } = user;
  const { name, mobileNo, role } = req.body;

  // if the user is admin then he can update the role of the user as well
  const updatedRole = role ? role : user.role;
  const updatedName = name ? name : user.name;

  //Validate and format the mobile number if provided
  const formattedMobileNo = mobileNo
    ? checkMobileNumber(mobileNo, next)
    : user.mobileNo;
  // if no mobile number is provided then the checkMobileNumber function will return undefined so we will not update the mobile number in the database and don't send the response as it is sent in the checkMobileNumber function
  if (!formattedMobileNo) {
    return;
  }
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      name: updatedName,
      mobileNo: formattedMobileNo,
      role: updatedRole,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    updatedUser,
  });
});

// Update Current user password => /api/v1/users/me
exports.updateCurrentUserPassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const { _id } = req.user;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }

  const user = await User.findById(_id).select("+password");
  const isPasswordMatched = await user.comparePassword(currentPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});
