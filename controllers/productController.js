const { catchAsyncErrors } = require("../middleware/catchAsyncError");
const Product = require("../models/productModel");
const { ErrorHandler } = require("../utils/ErrorHandler");
const apiFeature = require("../utils/apiFeatures");
const { uploadFile } = require("../utils/cloudinary/uploadFile");

// Post Create new product => /api/v1/product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  req.body.user = req.user._id;

  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  const imagesLinks = [];

  const option = {
    folder: "products",
    width: 557,
    height: 650,
    crop: "scale",
  };

  // loop through images array and upload each image to cloudinary
  for (let i = 0; i < images.length; i++) {
    const result = await uploadFile(images[i], option, next);
    imagesLinks.push({
      publicId: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

//  Get all products => /api/v1/products
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const apiFeatures = new apiFeature(Product.find(), req.query)
    .search()
    .filter()
    .filterByRating()
    .filterByCategory()
    .pagination();

  const products = await apiFeatures.query;

  const resultsCount = await new apiFeature(Product.find(), req.query)
    .search()
    .filter()
    .filterByRating()
    .filterByCategory()
    .query.countDocuments();

  // comment because in my frontend i get some someIssue with redux store when it throw error if it not found a product
  // // check if there are no products
  // if (products.length === 0)
  //   return next(new ErrorHandler("No products found.", 404));

  res.status(200).json({
    success: true,
    results: resultsCount,
    returnProducts: products.length,
    products,
  });
});

// Get single product details => /api/v1/product/:id
exports.getProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate(
    "reviews.user"
  );

  // Check if product exists
  if (!product) return next(new ErrorHandler("Product not found.", 404));

  res.status(200).json({
    success: true,
    product,
  });
});

// Update product => /api/v1/product/:id -- Admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  // Check if product exists
  if (!product) return next(new ErrorHandler("No products found.", 404));

  res.status(204).json({
    success: true,
  });
});

// Delete product => /api/v1/product/:id -- Admin
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findByIdAndDelete(id);

    // Check if product exists
    if (!product) return next(new ErrorHandler("No products found.", 404));
    res.status(204).json({
      success: true,
    });
  } catch (error) {
    next(new ErrorHandler(error.message));
  }
});

// Create new review => /api/v1/review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  if (!rating || !comment || !productId) {
    return next(new ErrorHandler("Required Fields are Missing", 404));
  }

  if (rating < 1 || rating > 5) {
    return next(new ErrorHandler("Rating must be between 1 and 5", 404));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product does't exists", 404));
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment: comment,
  };
  const isReviewExist = product.reviews.find(
    (rev) => req.user._id.toString() === rev.user.toString()
  );

  if (isReviewExist) {
    isReviewExist.comment = comment;
    isReviewExist.rating = Number(rating);
  } else {
    product.reviews.push(review);
  }

  // Finding Sum of All the reviews rating present in product Reviews Array
  const ratingSum = product.reviews.reduce(
    (acc, rev) => (acc += rev.rating),
    0
  );

  product.numOfReviews = product.reviews.length;
  product.ratings = ratingSum / product.numOfReviews;

  product.save();

  res.status(200).json({
    success: true,
    reviews: product.reviews,
    numOfReviews: product.numOfReviews,
    rating: product.ratings,
    message: "Review added Successfully",
  });
});

// Get product Reviews => /api/v1/review?id=650824318197c7f5479f0cac
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.query;
  const product = await Product.findOne({ _id: id }).populate("reviews.user");

  const reviews = product.reviews;
  const ratings = product.ratings;
  const productName = product.name;
  const productImg = product.images[0].url;

  if (!product) {
    return next(new ErrorHandler("No Product Found", 404));
  }

  res.status(200).json({
    success: true,
    reviews,
    ratings,
    productName,
    productImg,
    totalReviews: reviews.length,
  });
});

// Delete A Review => /api/v1/review?id=650824318197c7f5479f0cac
exports.deleteProductReview = catchAsyncErrors(async (req, res, next) => {
  const productReview = await Product.findOne({
    "reviews._id": req.query.id,
  });
  if (!productReview) {
    return next(new ErrorHandler("No product with this review found", 404));
  }

  const filteredReviews = productReview.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  // Finding Sum of All the reviews rating present in product Reviews Array
  const ratingSum = filteredReviews.reduce(
    (acc, rev) => (acc += rev.rating),
    0
  );

  productReview.numOfReviews = filteredReviews.length;
  productReview.ratings = Number(ratingSum / filteredReviews.length);

  productReview.reviews = filteredReviews;
  productReview.save();

  res.status(200).json({
    success: true,
    productReview,
  });
});

// get all productsCategories => /api/v1/products/categories
exports.getProductsCategories = catchAsyncErrors(async (req, res, next) => {
  // Define the aggregation pipeline
  const pipeline = [
    {
      $group: {
        _id: null,
        categories: { $addToSet: "$category" },
      },
    },
    {
      $unwind: "$categories", // Convert categories array to separate documents
    },
    {
      $sort: {
        categories: 1, // Sort categories in ascending order
      },
    },
    {
      $group: {
        _id: null,
        categories: { $push: "$categories" }, // Push sorted categories into an array
      },
    },
    {
      $project: {
        _id: 0,
        categories: 1,
      },
    },
  ];

  const categories = await Product.aggregate(pipeline);
  const flatCategories = categories
    .map((item) => item.categories)
    .flat()
    .sort((a, b) => a - b);

  res.status(200).json({
    success: true,
    categories: flatCategories,
  });
});

// utilities route to get extra information about the products

exports.priceInfo = catchAsyncErrors(async (req, res, next) => {
  const pipeline = [
    {
      $group: {
        _id: null,
        minPrice: { $min: "$price" }, // Find the minimum price
        maxPrice: { $max: "$price" }, // Find the maximum price
      },
    },
    {
      $project: {
        _id: 0, // Exclude the _id field from the result
        minPrice: 1,
        maxPrice: 1,
      },
    },
  ];

  const data = await Product.aggregate(pipeline);

  if (data.length < 1) {
    return next(new ErrorHandler("No Product Found", 404));
  }

  const { minPrice, maxPrice } = data[0];

  return res.status(200).json({
    success: true,
    minPrice,
    maxPrice,
  });
});
