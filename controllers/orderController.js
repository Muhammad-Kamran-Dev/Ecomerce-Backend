const { catchAsyncErrors } = require("../middleware/catchAsyncError");
const Order = require("../models/orderModel");
const { ErrorHandler } = require("../utils/ErrorHandler");
const {
  updateStock,
  getOutOfStockProducts,
  checkOutOfStockProducts,
} = require("../utils/orderHelper");
const Product = require("../models/productModel");

// Create new order => /api/v1/order/new
exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    phoneNo,
  } = req.body;

  // Check if all products are in stock
  const outOfStockProducts = await getOutOfStockProducts(orderItems, Product);
  const errorMsg = await checkOutOfStockProducts(outOfStockProducts);

  if (errorMsg) {
    return next(new ErrorHandler(errorMsg, 400));
  }

  const order = await Order.create({
    shippingInfo,
    orderItems,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    phoneNo,
    paidAt: Date.now(),
    deliveredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    user: req.user._id,
  });

  if (!order)
    return next(
      new ErrorHandler("Something went wrong while creating order.", 500)
    );

  res.status(201).json({
    success: true,
    order,
  });
});

// Get single order => /api/v1/order/:id
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate({
      path: "orderItems.product",
      select: "name price ",
    });

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

// Get logged in user orders => /api/v1/orders/me
exports.getMyOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).populate(
    "user",
    "name email"
  );

  res.status(200).json({
    success: true,
    totalOrders: orders.length,
    orders,
  });
});

// update logged in user orders => /api/v1/orders/me/:id
exports.updateMyOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    phoneNo,
  } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  // Check for orderStatus if it is delivered or not yet delivered
  if (order.orderStatus === "Delivered")
    return next(new ErrorHandler("You have already received this order", 400));

  const isOrderOwner = order.user.toString() === req.user._id.toString();

  if (!isOrderOwner) {
    return next(
      new ErrorHandler("You are not authorized to update this order", 403)
    );
  }

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    {
      shippingInfo,
      orderItems,
      itemPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo,
      phoneNo,
      paidAt: Date.now(),
      deliveredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user: req.user._id,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    updatedOrder,
  });
});

// Cancel logged in user orders => /api/v1/orders/me/:id
exports.cancelMyOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  const isOrderOwner = order.user.toString() === req.user._id.toString();

  if (!isOrderOwner) {
    return next(
      new ErrorHandler("You are not authorized to cancel this order", 403)
    );
  }

  await Order.findByIdAndDelete(req.params.id);

  res.status(204).json({
    success: true,
  });
});

// Get all orders - ADMIN => /api/v1/orders
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find().populate("user", "name email");

  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  res.status(200).json({
    success: true,
    totalAmount,
    totalOrders: orders.length,
    orders,
  });
});

// Update / Process order - ADMIN => /api/v1/order/:id
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    phoneNo,
  } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    {
      shippingInfo,
      orderItems,
      itemPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo,
      phoneNo,
      paidAt: Date.now(),
      deliveredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user: req.user._id,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    updatedOrder,
  });
});

//Delete order => /api/v1/order/:id
exports.cancelOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  res.status(204).json({
    success: true,
  });
});

// Update order status - ADMIN => /api/v1/order/:id
exports.updateStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already received this order", 400));
  }

  // Check if all products are in stock
  const outOfStockProducts = await getOutOfStockProducts(
    order.orderItems,
    Product
  );
  const errorMsg = await checkOutOfStockProducts(outOfStockProducts);

  if (errorMsg) {
    return next(new ErrorHandler(errorMsg, 400));
  }

  order.orderStatus = req.body.orderStatus;
  if (req.body.orderStatus === "Delivered") {
    order.deliveredAt = Date.now();
  }
  order.orderItems.forEach(async (item) => {
    await updateStock(item.product, item.quantity);
  });

  order.save();

  res.status(200).json({
    status: true,
    message: "Status Updated Successfully",
    order,
  });
});
