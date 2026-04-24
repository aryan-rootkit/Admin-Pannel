const express = require("express");
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require("./controller");

const router = express.Router();

router.get("/", getClients);
router.get("/:id", getClientById);
router.post("/", createClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

module.exports = router;

