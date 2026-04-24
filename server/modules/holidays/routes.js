const express = require("express");
const { getHolidays } = require("./controller");

const router = express.Router();
router.get("/", getHolidays);

module.exports = router;
