const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      maxLength: [30, "Your name cannot exceed 30 characters"],
      minLength: [4, "Name should have more then 5 characters"],
    },

    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: [validator.isEmail, "Please enter valid email address"],
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password should have more then 8 characters"],
      select: false,
    },
    mobileNo: {
      type: String,
      default: "",
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    role: {
      type: String,
      default: "user",
      Enum: {
        values: ["user", "admin"],
        message: "Please select correct role",
      },
    },
    description: {
      type: String,
      default: "",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },

  { timestamps: true }
);

// Forcefully create a unique index on the email field because by default it is not created by mongoose
UserSchema.index({ email: 1 }, { unique: true });

// Encrypting password before saving user => pre middleware
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare user password in login route => instance method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// mongoose method to get the Jwt token
UserSchema.methods.getJWTToken = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

// decrypt the jwt token to get the user id and name
UserSchema.decryptJWTToken = async function (token) {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Get password reset token
UserSchema.methods.getPasswordResetToken = function () {
  // Generate token using crypto
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash and set to resetPasswordToken field in the user model
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expire time
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  // return the reset token in plain formate
  return resetToken;
};
module.exports = mongoose.model("User", UserSchema);
