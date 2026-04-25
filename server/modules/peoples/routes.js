const express = require("express");
const {
  getPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
} = require("./controller");

const router = express.Router();

router.get("/", getPeople);
router.post("/", createPerson);
router.get("/:id", getPersonById);
router.put("/:id", updatePerson);
router.delete("/:id", deletePerson);

module.exports = router;
