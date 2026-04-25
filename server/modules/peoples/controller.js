const mongoose = require("mongoose");
const { People } = require("./model");
const { Project } = require("../projects/model");
const { buildPersonIdToProjectsMap } = require("../lib/memberIndex");
const {
  dedupeProjectIds,
  syncPersonProjects,
  assignProjectToPerson,
} = require("./projectAssignment");

function normalizeAssignedProjectEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { _id: entry, name: "" };
  if (entry._id && entry.name !== undefined) return { _id: entry._id, name: entry.name };
  return { _id: entry._id || entry, name: entry.name || "" };
}

const getPeople = async (_req, res) => {
  try {
    const extraByPerson = await buildPersonIdToProjectsMap(Project);

    const people = await People.find()
      .populate({
        path: "assignedProjects",
        select: "name budget clientId",
        populate: { path: "clientId", select: "name email contact" },
      })
      .sort({ _id: -1 })
      .lean();

    for (const person of people) {
      const pid = String(person._id);
      const fromDb = (person.assignedProjects || [])
        .filter(Boolean)
        .map(normalizeAssignedProjectEntry)
        .filter(Boolean);
      const fromProjects = extraByPerson.get(pid) || [];
      const seen = new Set(fromDb.map((x) => String(x._id)));
      const merged = [...fromDb];
      for (const pr of fromProjects) {
        const id = String(pr._id);
        if (!seen.has(id)) {
          merged.push({ _id: pr._id, name: pr.name });
          seen.add(id);
        }
      }
      person.assignedProjects = merged;
    }

    console.log("[GET /api/people] count:", people.length);
    return res.json(people);
  } catch (err) {
    console.error("[GET /api/people] error:", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const getPersonById = async (req, res) => {
  try {
    const person = await People.findById(req.params.id).lean();
    if (!person) return res.status(404).json({ message: "Person not found" });
    return res.json(person);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createPerson = async (req, res) => {
  try {
    const { name, email, contact, role, assignedProjects } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });
    const projectIds = dedupeProjectIds(assignedProjects);

    const person = await People.create({
      name,
      email,
      contact,
      role,
      assignedProjects: projectIds,
    });

    if (projectIds.length) await syncPersonProjects(person._id, projectIds);

    const doc = await People.findById(person._id).lean();
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const updatePerson = async (req, res) => {
  try {
    const { name, email, contact, role, assignedProjects } = req.body || {};
    const person = await People.findById(req.params.id);
    if (!person) return res.status(404).json({ message: "Person not found" });

    if (assignedProjects !== undefined) {
      const projectIds = dedupeProjectIds(assignedProjects);
      await syncPersonProjects(person._id, projectIds);
      person.assignedProjects = projectIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }
    if (name !== undefined) person.name = name;
    if (email !== undefined) person.email = email;
    if (contact !== undefined) person.contact = contact;
    if (role !== undefined) person.role = role;
    await person.save();

    const doc = await People.findById(person._id).lean();
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deletePerson = async (req, res) => {
  try {
    const id = req.params.id;
    await Project.updateMany(
      {},
      {
        $pull: {
          assignedTeam: id,
          peopleIds: id,
          teamIds: id,
        },
      }
    );
    const removed = await People.findByIdAndDelete(id).lean();
    if (!removed) return res.status(404).json({ message: "Person not found" });
    return res.json({ ok: true, id });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  getPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  assignProjectToPerson,
};
