const express = require("express");
const { testing } = require("../controllers/testController");
const router = express.Router();

router.route("/").get(testing);

module.exports = router;
