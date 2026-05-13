/**
 * Build map personId -> minimal project refs from projects that list members
 * via assignedTeam, legacy peopleIds, or teamIds (same collection as People).
 */
async function buildPersonIdToProjectsMap(Project) {
  const projects = await Project.find({
    $or: [
      { assignedTeam: { $exists: true, $ne: [] } },
      { peopleIds: { $exists: true, $ne: [] } },
      { teamIds: { $exists: true, $ne: [] } },
    ],
  })
    .select("name assignedTeam peopleIds teamIds")
    .lean();

  const map = new Map();
  for (const proj of projects) {
    const ids = memberIdsFromProjectLean(proj);
    const ref = { _id: proj._id, name: proj.name };
    for (const mid of ids) {
      if (!map.has(mid)) map.set(mid, []);
      const list = map.get(mid);
      if (!list.some((p) => String(p._id) === String(ref._id))) list.push(ref);
    }
  }
  return map;
}

function memberIdsFromProjectLean(proj) {
  const fromShares = (proj.teamMemberShares || [])
    .map((s) => {
      if (!s || typeof s !== "object") return "";
      const pid = s.peopleId;
      if (pid && typeof pid === "object" && pid._id) return String(pid._id);
      return pid ? String(pid) : "";
    })
    .filter(Boolean);
  return [
    ...new Set(
      [
        ...fromShares,
        ...(proj.assignedTeam || []),
        ...(proj.peopleIds || []),
        ...(proj.teamIds || []),
      ].map((id) => {
        if (typeof id === "string") return id;
        if (id && typeof id === "object" && id._id) return String(id._id);
        return id ? String(id) : "";
      })
    ),
  ];
}

module.exports = { buildPersonIdToProjectsMap, memberIdsFromProjectLean };
