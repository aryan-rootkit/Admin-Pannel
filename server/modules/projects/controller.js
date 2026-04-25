/**
 * Example populated query:
 * Project.find()
 *   .populate("clientId", "name email contact")
 *   .populate("assignedTeam", "name email contact");
 */
const { Project } = require("./model");
const { People } = require("../peoples/model");
const { memberIdsFromProjectLean } = require("../lib/memberIndex");

async function hydrateAssignedTeamForProjects(projectsLean) {
  const needIds = new Set();
  for (const p of projectsLean) {
    const has = (p.assignedTeam || []).filter(Boolean).length;
    if (!has) {
      memberIdsFromProjectLean(p).forEach((id) => needIds.add(id));
    }
  }
  if (!needIds.size) return;
  const people = await People.find({ _id: { $in: [...needIds] } })
    .select("name email contact")
    .lean();
  const byId = new Map(people.map((doc) => [String(doc._id), doc]));
  for (const p of projectsLean) {
    if ((p.assignedTeam || []).filter(Boolean).length) continue;
    const ids = memberIdsFromProjectLean(p);
    p.assignedTeam = ids.map((id) => byId.get(id)).filter(Boolean);
  }
}

const getProjects = async (_req, res) => {
  try {
    const projects = await Project.find()
      .populate("clientId", "name email contact phone")
      .populate("assignedTeam", "name email contact")
      .sort({ createdAt: -1 })
      .lean();
    await hydrateAssignedTeamForProjects(projects);
    for (const p of projects) {
      if (Array.isArray(p.assignedTeam))
        p.assignedTeam = p.assignedTeam.filter(Boolean);
    }
    console.log("[GET /api/projects] count:", projects.length);
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, clientId, budget, status, assignedTeam, peopleIds, teamIds } =
      req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });
    if (!clientId) return res.status(400).json({ message: "clientId is required" });

    const mergedTeam = [
      ...new Set(
        [
          ...(assignedTeam || []),
          ...(peopleIds || []),
          ...(teamIds || []),
        ].map((id) => String(id))
      ),
    ];

    const project = await Project.create({
      name,
      clientId,
      budget,
      status,
      assignedTeam: mergedTeam.length ? mergedTeam : undefined,
    });

    if (mergedTeam.length) {
      await People.updateMany(
        { _id: { $in: mergedTeam } },
        { $addToSet: { assignedProjects: project._id } }
      );
    }

    const populated = await Project.findById(project._id)
      .populate("clientId", "name email contact phone")
      .populate("assignedTeam", "name email contact")
      .lean();
    await hydrateAssignedTeamForProjects([populated]);
    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

async function syncProjectMembers(projectId, memberIds) {
  const pid = projectId;
  await People.updateMany(
    { assignedProjects: pid },
    { $pull: { assignedProjects: pid } }
  );
  const ids = [...new Set((memberIds || []).map(String))].filter(Boolean);
  if (ids.length) {
    await People.updateMany(
      { _id: { $in: ids } },
      { $addToSet: { assignedProjects: pid } }
    );
  }
}

const updateProject = async (req, res) => {
  try {
    const { name, clientId, budget, status, assignedTeam, peopleIds, teamIds } =
      req.body || {};
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const mergedTeam = [
      ...new Set(
        [
          ...(assignedTeam || project.assignedTeam || []),
          ...(peopleIds || []),
          ...(teamIds || []),
        ].map((id) => String(id))
      ),
    ];
    if (assignedTeam !== undefined || peopleIds !== undefined || teamIds !== undefined) {
      await syncProjectMembers(project._id, mergedTeam);
    }

    if (name !== undefined) project.name = name;
    if (clientId !== undefined) project.clientId = clientId;
    if (budget !== undefined) project.budget = budget;
    if (status !== undefined) project.status = status;
    if (assignedTeam !== undefined || peopleIds !== undefined || teamIds !== undefined) {
      project.assignedTeam = mergedTeam.length ? mergedTeam : [];
    }
    await project.save();

    const populated = await Project.findById(project._id)
      .populate("clientId", "name email contact phone")
      .populate("assignedTeam", "name email contact")
      .lean();
    await hydrateAssignedTeamForProjects([populated]);
    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const id = req.params.id;
    await People.updateMany(
      { assignedProjects: id },
      { $pull: { assignedProjects: id } }
    );
    const removed = await Project.findByIdAndDelete(id).lean();
    if (!removed) return res.status(404).json({ message: "Project not found" });
    return res.json({ ok: true, id });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
