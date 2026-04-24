const express = require("express");
const {
  getRevenues,
  createRevenue,
  updateRevenue,
  deleteRevenue,
} = require("./controller");

const router = express.Router();

router.get("/", getRevenues);
router.post("/", createRevenue);
router.put("/:id", updateRevenue);
router.delete("/:id", deleteRevenue);

module.exports = router;
