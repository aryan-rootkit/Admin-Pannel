const express = require("express");
const { getEvents } = require("./controller");

const router = express.Router();
router.get("/", getEvents);

module.exports = router;
