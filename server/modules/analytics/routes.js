const express = require("express");
const { getProfit, getMonthly, getFinance } = require("./controller");

const router = express.Router();

router.get("/profit", getProfit);
router.get("/finance", getFinance);
router.get("/monthly", getMonthly);

module.exports = router;
