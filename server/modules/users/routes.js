const express = require("express");
const { getUsers } = require("./controller");

const router = express.Router();
router.get("/", getUsers);

module.exports = router;
