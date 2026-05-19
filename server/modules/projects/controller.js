/**
 * Example populated query:
 * Project.find()
 *   .populate("clientId", "name email contact")
 *   .populate("assignedTeam", "name email contact");
 */
const { Project } = require("./model");
const { People } = require("../peoples/model");
const { memberIdsFromProjectLean } = require("../lib/memberIndex");
const { projectStatusBucket, compareProjectsForList } = require("../lib/projectFinance");

function parseOptionalDate(value) {
  if (value === null || value === "") return null;
  if (value === undefined) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function applyCompletedAtOnSave(project, { status, completedAt }) {
  if (completedAt !== undefined) {
    project.completedAt = completedAt;
  }
  if (status !== undefined) {
    project.status = status;
    if (projectStatusBucket(status) === "completed") {
      if (!project.completedAt) project.completedAt = new Date();
    } else if (completedAt === undefined) {
      project.completedAt = null;
    }
  }
}

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

/**
 * @param {unknown} raw
 * @returns {{ peopleId: string, sharePercent: number }[]}
 */
function normalizeTeamMemberSharesPayload(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const pid = row.peopleId || row.personId;
    if (!pid) continue;
    const id = String(pid);
    if (seen.has(id)) continue;
    seen.add(id);
    let pct = Number(row.sharePercent);
    if (!Number.isFinite(pct)) pct = 0;
    pct = Math.max(0, Math.min(100, pct));
    if (pct <= 0) continue;
    out.push({ peopleId: id, sharePercent: pct });
  }
  const sum = out.reduce((s, r) => s + r.sharePercent, 0);
  if (sum > 100.01) {
    const err = new Error("Team share percentages must sum to at most 100% of contract value");
    err.code = "SHARE_SUM";
    throw err;
  }
  return out;
}

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("clientId", "name email contact phone")
      .populate("assignedTeam", "name email contact")
      .populate("teamMemberShares.peopleId", "name email contact")
      .lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    await hydrateAssignedTeamForProjects([project]);
    if (Array.isArray(project.assignedTeam)) project.assignedTeam = project.assignedTeam.filter(Boolean);
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const getProjects = async (_req, res) => {
  try {
    const projects = await Project.find()
      .populate("clientId", "name email contact phone")
      .populate("assignedTeam", "name email contact")
      .populate("teamMemberShares.peopleId", "name email contact")
      .lean();
    await hydrateAssignedTeamForProjects(projects);
    for (const p of projects) {
      if (Array.isArray(p.assignedTeam))
        p.assignedTeam = p.assignedTeam.filter(Boolean);
    }
    projects.sort(compareProjectsForList);
    console.log("[GET /api/projects] count:", projects.length);
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const createProject = async (req, res) => {
  try {
    const {
      name,
      clientId,
      budget,
      totalValue,
      status,
      completedAt,
      assignedTeam,
      peopleIds,
      teamIds,
      teamMemberShares,
    } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });
    if (!clientId) return res.status(400).json({ message: "clientId is required" });

    let normalizedShares = [];
    try {
      normalizedShares = normalizeTeamMemberSharesPayload(teamMemberShares);
    } catch (e) {
      if (e.code === "SHARE_SUM") return res.status(400).json({ message: e.message });
      throw e;
    }

    const mergedTeam = [
      ...new Set(
        [
          ...normalizedShares.map((s) => s.peopleId),
          ...(assignedTeam || []),
          ...(peopleIds || []),
          ...(teamIds || []),
        ].map((id) => String(id))
      ),
    ].filter(Boolean);

    const parsedCompletedAt = parseOptionalDate(completedAt);
    const project = await Project.create({
      name,
      clientId,
      budget,
      totalValue: totalValue != null ? Number(totalValue) : undefined,
      status,
      completedAt: parsedCompletedAt === undefined ? undefined : parsedCompletedAt,
      assignedTeam: mergedTeam.length ? mergedTeam : undefined,
      teamMemberShares: normalizedShares.length ? normalizedShares : undefined,
    });
    if (
      projectStatusBucket(project.status) === "completed" &&
      !project.completedAt
    ) {
      project.completedAt = new Date();
      await project.save();
    }

    if (mergedTeam.length) {
      await People.updateMany(
        { _id: { $in: mergedTeam } },
        { $addToSet: { assignedProjects: project._id } }
      );
    }

    const populated = await Project.findById(project._id)
      .populate("clientId", "name email contact phone")
      .populate("assignedTeam", "name email contact")
      .populate("teamMemberShares.peopleId", "name email contact")
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
    const {
      name,
      clientId,
      budget,
      totalValue,
      status,
      completedAt,
      assignedTeam,
      peopleIds,
      teamIds,
      teamMemberShares,
    } = req.body || {};
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    let mergedTeam = [
      ...new Set(
        [
          ...(assignedTeam !== undefined ? assignedTeam : project.assignedTeam || []),
          ...(peopleIds || []),
          ...(teamIds || []),
        ].map((id) => String(id))
      ),
    ].filter(Boolean);

    if (teamMemberShares !== undefined) {
      let normalizedShares = [];
      try {
        normalizedShares = normalizeTeamMemberSharesPayload(teamMemberShares);
      } catch (e) {
        if (e.code === "SHARE_SUM") return res.status(400).json({ message: e.message });
        throw e;
      }
      project.teamMemberShares = normalizedShares;
      const shareIds = normalizedShares.map((s) => s.peopleId);
      mergedTeam = [...new Set([...shareIds.map(String), ...mergedTeam])];
    }

    if (assignedTeam !== undefined || peopleIds !== undefined || teamIds !== undefined || teamMemberShares !== undefined) {
      await syncProjectMembers(project._id, mergedTeam);
    }

    if (name !== undefined) project.name = name;
    if (clientId !== undefined) project.clientId = clientId;
    if (budget !== undefined) project.budget = budget;
    if (totalValue !== undefined) project.totalValue = totalValue;
    applyCompletedAtOnSave(project, {
      status,
      completedAt: parseOptionalDate(completedAt),
    });
    if (assignedTeam !== undefined || peopleIds !== undefined || teamIds !== undefined || teamMemberShares !== undefined) {
      project.assignedTeam = mergedTeam.length ? mergedTeam : [];
    }
    await project.save();

    const populated = await Project.findById(project._id)
      .populate("clientId", "name email contact phone")
      .populate("assignedTeam", "name email contact")
      .populate("teamMemberShares.peopleId", "name email contact")
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

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
