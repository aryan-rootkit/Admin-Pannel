const express = require("express");
const { getSettings } = require("./controller");

const router = express.Router();
router.get("/", getSettings);

module.exports = router;
