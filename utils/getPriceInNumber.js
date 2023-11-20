exports.getPriceInNumber = (price) => {
  // Step 1: Convert the input price object to a JSON string
  let queryStr = JSON.stringify(price);

  // Step 2 Check if the query string contains any comparison operator ($gt, $lte, etc)
  if (!isComparisonOperatorInclude(queryStr)) {
    return { price };
  }

  // Step 3: If comparison operator is included then Replace comparison operator keys with '$' prefixed keys
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|eq)\b/g,
    (match) => `$${match}`
  );

  // Step 4: Parse the modified JSON string back into an object
  const priceObj = JSON.parse(queryStr);

  // Step 5: Initialize a new object to store the numeric values
  const priceNumber = { price: {} };

  // Step 6: Iterate through the entries of the modified object
  Object.entries(priceObj).forEach(([key, value]) => {
    // Convert the value to a number and store it in the 'price' object
    priceNumber.price[key] = Number(value);
  });

  // Step 7: Return the final object with numeric values
  return priceNumber;
};

const isComparisonOperatorInclude = (queryStr) => {
  // Check if the query string contains the 'gt', 'gte', 'lt', or 'lte' substring
  const checkOperators = ["gt", "gte", "lt", "lte", "eq"];

  // Check if the query string contains any of the comparison operators
  const isOperatorPresent = checkOperators.some((operator) =>
    queryStr.includes(operator)
  );

  return isOperatorPresent;
};
