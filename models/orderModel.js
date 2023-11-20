const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  shippingInfo: {
    address: {
      type: String,
      required: [true, "Please enter your address"],
    },
    city: {
      type: String,
      required: [true, "Please enter your city"],
    },
    state: {
      type: String,
      required: [true, "Please enter your state"],
    },
    phoneNo: {
      type: String,
      required: [true, "Please enter your phone number"],
      minLength: [11, "Phone number cannot be less than 11 characters"],
      maxLength: [11, "Phone number cannot exceed 11 characters"],
    },
    country: {
      type: String,
      required: [true, "Please enter your country"],
    },

    pinCode: {
      type: Number,
      required: [true, "Please enter your Pin code"],
    },
  },

  orderItems: [
    {
      name: {
        type: String,
        required: [true, "Please enter product name"],
      },
      quantity: {
        type: Number,
        required: [true, "Please enter product quantity"],
      },
      price: {
        type: Number,
        required: [true, "Please enter product price"],
      },

      image: {
        type: String,
        required: [true, "Please enter product image"],
      },

      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
      },
    },
  ],

  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  paymentInfo: {
    id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  paidAt: {
    type: Date,
    required: true,
  },
  itemPrice: {
    type: Number,
    required: true,
  },
  taxPrice: {
    type: Number,
    required: true,
  },
  shippingPrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },

  orderStatus: {
    type: String,
    required: true,
    default: "Processing",
  },
  deliveredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", OrderSchema);
