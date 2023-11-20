const { catchAsyncErrors } = require("../middleware/catchAsyncError");

exports.testing = catchAsyncErrors(async (req, res, next) => {
  res.status(201).json({
    success: true,
    message: "its working",
  });
});
