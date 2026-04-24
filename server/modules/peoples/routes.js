const express = require("express");
const {
  getTeams,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
} = require("./controller");

const router = express.Router();

router.get("/", getTeams);
router.post("/", createPerson);
router.get("/:id", getPersonById);
router.put("/:id", updatePerson);
router.delete("/:id", deletePerson);

module.exports = router;
