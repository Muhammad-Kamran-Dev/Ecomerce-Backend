const cloudinary = require("cloudinary");
const { ErrorHandler } = require("../ErrorHandler");
exports.uploadFile = async (file, option, next) => {
  try {
    return await cloudinary.v2.uploader.upload(file, option);
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
    return null;
  }
};
