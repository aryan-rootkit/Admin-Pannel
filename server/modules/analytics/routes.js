const express = require("express");
const { getProfit } = require("./controller");

const router = express.Router();

router.get("/profit", getProfit);

module.exports = router;
