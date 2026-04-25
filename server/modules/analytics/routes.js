const express = require("express");
const { getProfit, getMonthly } = require("./controller");

const router = express.Router();

router.get("/profit", getProfit);
router.get("/monthly", getMonthly);

module.exports = router;
