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
  return [
    ...new Set(
      [
        ...(proj.assignedTeam || []),
        ...(proj.peopleIds || []),
        ...(proj.teamIds || []),
      ].map((id) => String(id))
    ),
  ];
}

module.exports = { buildPersonIdToProjectsMap, memberIdsFromProjectLean };
