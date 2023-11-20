const cloudinary = require("cloudinary");
const { ErrorHandler } = require("./ErrorHandler");
exports.uploadFile = async (file, next) => {
  try {
    return await cloudinary.v2.uploader.upload(file, {
      folder: "avatars",
      width: 300,
      height: 300,
      crop: "scale",
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 400));
    return null;
  }
};
