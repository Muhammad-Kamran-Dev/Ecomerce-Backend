// connect to mongodb using mongoose

const mongoose = require("mongoose");
const config = require("./index");

const ConnectDb = () => {
  mongoose
    .connect(config.dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((conn) => {
      console.log(`mongodb connected successfully ${conn.connection.host}`);
    });
};

module.exports = ConnectDb;
