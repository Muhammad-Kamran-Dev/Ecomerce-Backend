const Product = require("../models/productModel");
const { ErrorHandler } = require("./ErrorHandler");

exports.updateStock = async (productId, quantity) => {
  await Product.findOneAndUpdate(productId, {
    $inc: { stock: -quantity },
  });
};

// check the product in stock if the product is in stock or not
exports.getOutOfStockProducts = async (orderItems, Product) => {
  const outOfStockProducts = await Promise.all(
    orderItems.map(async (item) => {
      const product = await Product.findById(item.product);
      if (product.stock < item.quantity) {
        return `${product.name} is out of stock${
          product.stock > 0
            ? ` only ( ${product.stock} ) left. Please reduce the quantity from ( ${item.quantity} ) and try Again !. `
            : "."
        } `;
      } else {
        // Return null for in-stock products
        return null;
      }
    })
  );

  const filteredOutOfStockProducts = outOfStockProducts.filter(
    (product) => product != null
  );

  return filteredOutOfStockProducts;
};

// Check if the product is in stock or not using the getOutOfStockProducts function and return the error if the product is out of stock
exports.checkOutOfStockProducts = async (outOfStockProducts) => {
  if (outOfStockProducts.length > 0) {
    const outOfStockProductsName = outOfStockProducts.map((product, index) => {
      return `${index + 1}:- ${product}`;
    });

    const errorMsg = `${
      outOfStockProducts.length > 1
        ? outOfStockProductsName.join(", ")
        : outOfStockProductsName
    }`;
    return errorMsg;
  }
  return null;
};
