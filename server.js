const app = require("./app");
const ConnectDb = require("./config/db");
const config = require("./config");
const cloudinary = require("cloudinary");

// handling uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to uncaught exception");
  process.exit(1);
});

ConnectDb();

// configure cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryCloudApiKey,
  api_secret: config.cloudinaryCloudApiSecret,
});

const server = app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to unhandled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});
