const express = require("express");
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("./controller");

const router = express.Router();

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;

