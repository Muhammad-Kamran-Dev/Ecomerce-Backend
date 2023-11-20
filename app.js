const express = require("express");
const cookieParser = require("cookie-parser"); // Fixed typo here
const errorMiddleware = require("./middleware/error");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");

const app = express();

// Middleware to parse the body
app.use(express.json({ limit: "50mb" }));
app.use(
  cors({
    credentials: true,
    origin: [
      "https://ecomerce-front-end-three.vercel.app",
      "http://localhost:3000",
    ],
  })
);
// Middleware to parse the cookies
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// Route Imports
const products = require("./routes/productRoute");
const auth = require("./routes/authRoute");
const order = require("./routes/orderRoute");
const testingRoute = require("./routes/testRoute");

// testing route
app.use("/api/v1/test", testingRoute);

// Middleware to handle routes
app.use("/api/v1/products", products);
app.use("/api/v1/users", auth);
app.use("/api/v1/orders", order);

// Middleware to handle errors
app.use(errorMiddleware);

module.exports = app;
