const mongoose = require("mongoose");

const { Types } = mongoose;
const { People } = require("./model");
const { Project } = require("../projects/model");

/** Unique, non-empty project id strings (ObjectId strings). */
function dedupeProjectIds(projectIds) {
  return [...new Set((projectIds || []).map(String))].filter(Boolean);
}

/**
 * Weekly labour cost for one person (null-safe).
 * @param {{ hourlyRate?: unknown; hoursWorkedThisWeek?: unknown }} person
 */
function weeklyCostForPerson(person) {
  const rate = Number(person?.hourlyRate);
  const hours = Number(person?.hoursWorkedThisWeek);
  const r = Number.isFinite(rate) ? rate : 0;
  const h = Number.isFinite(hours) ? hours : 0;
  return r * h;
}

/**
 * Rewrites project membership for one person: removes them from all projects,
 * then adds them to `newProjectIds` via assignedTeam ($addToSet).
 */
async function syncPersonProjects(personId, newProjectIds) {
  const pid = personId;
  const ids = dedupeProjectIds(newProjectIds);
  await Project.updateMany(
    {},
    {
      $pull: {
        assignedTeam: pid,
        peopleIds: pid,
        teamIds: pid,
      },
    }
  );
  for (const prId of ids) {
    await Project.updateOne({ _id: prId }, { $addToSet: { assignedTeam: pid } });
  }
}

/**
 * Idempotently assign one project to a person (no duplicate assignedProjects).
 * @returns {Promise<object|null>} Lean person document after save, or null if missing.
 */
async function assignProjectToPerson(personId, projectId) {
  if (!Types.ObjectId.isValid(personId)) {
    const err = new Error("Invalid person id");
    err.statusCode = 400;
    throw err;
  }
  if (!Types.ObjectId.isValid(projectId)) {
    const err = new Error("Invalid project id");
    err.statusCode = 400;
    throw err;
  }

  const person = await People.findById(personId);
  if (!person) {
    const err = new Error("Person not found");
    err.statusCode = 404;
    throw err;
  }
  const project = await Project.findById(projectId);
  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  const plain = person.toObject();
  const existing = (plain.assignedProjects || []).map((id) => String(id));
  const pid = String(projectId);

  if (existing.includes(pid)) {
    await syncPersonProjects(person._id, existing);
    return People.findById(personId).lean();
  }

  const newIds = dedupeProjectIds([...existing, pid]);
  await syncPersonProjects(person._id, newIds);
  person.assignedProjects = newIds.map((id) => new Types.ObjectId(id));
  await person.save();
  return People.findById(personId).lean();
}

module.exports = {
  dedupeProjectIds,
  weeklyCostForPerson,
  syncPersonProjects,
  assignProjectToPerson,
};
