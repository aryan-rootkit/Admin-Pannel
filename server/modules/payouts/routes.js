const express = require("express");
const {
  getPayouts,
  createPayout,
  updatePayout,
  deletePayout,
} = require("./controller");

const router = express.Router();

router.get("/", getPayouts);
router.post("/", createPayout);
router.put("/:id", updatePayout);
router.delete("/:id", deletePayout);

module.exports = router;
