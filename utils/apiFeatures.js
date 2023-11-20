const { getPriceInNumber } = require("./getPriceInNumber");

class apiFeature {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find(keyword);
    return this;
  }

  filter() {
    // filtering based on the category
    let queryCopy = JSON.parse(JSON.stringify(this.queryStr));
    const removeFields = ["keyword", "page", "limit", "rating", "categories"];
    removeFields.forEach((key) => delete queryCopy[key]);
    this.query = this.query.find(queryCopy);

    // Now filtering on price but the price is in string format
    if (queryCopy.price) {
      // Converting the price from string to number
      const priceNumber = getPriceInNumber(queryCopy.price);

      // delete from this.query _conditions: { price: { lte: '10', gte: '1' } }, price from the this.query
      delete this.query._conditions.price;

      // now merging the price with the other query conditions
      queryCopy = { ...queryCopy, ...priceNumber };

      // now filtering the query
      this.query = this.query.find(queryCopy);
    }

    // return this for chaining the methods in the controller file like this: const apiFeatures = new apiFeature(Product.find(), req.query).search().filter();
    return this;
  }

  filterByCategory() {
    if (this.queryStr.categories) {
      const categories = this.queryStr.categories.split(",");
      this.query = this.query.find({ category: { $in: categories } });
    }

    return this;
  }
  filterByRating() {
    let ratings = this.queryStr.ratings
      ? { ratings: { $gte: Number(this.queryStr.ratings) } }
      : {};

    this.query = this.query.find(ratings);
    return this;
  }

  pagination() {
    const resPerPage = this.queryStr.limit || 6;
    // convert currentPage to number
    const currentPage = Number(this.queryStr.page) || 1;
    // skip the number of products per page page=2&limit=5
    const skip = resPerPage * (currentPage - 1); // 5 * (2-1) = 5 products will be skipped

    this.query = this.query.limit(resPerPage).skip(skip);
    return this;
  }
}
module.exports = apiFeature;
