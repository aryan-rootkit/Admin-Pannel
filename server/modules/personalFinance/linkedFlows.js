const { Revenue } = require("../revenues/model");
const { Payout } = require("../payouts/model");
const { Project } = require("../projects/model");
const { People } = require("../peoples/model");
const { Client } = require("../clients/model");
const {
  FINANCE_EVENT_BUCKETS,
  interpretRevenue,
  interpretPayout,
  inRange,
  refId,
  findPersonalRelatedPeople,
  payoutLineDate,
} = require("../lib/financeIntelligence");
const { revenueLineStatus, revenueLineAmount } = require("../lib/financeHelpers");

function contractValue(project) {
  if (!project) return 0;
  return Math.max(0, Number(project.totalValue ?? project.budget ?? 0) || 0);
}

function payoutsForPersonProject(payouts, personId, projectId) {
  let s = 0;
  for (const row of payouts) {
    if (row.type === "subscription") continue;
    const pid = refId(row.peopleId) || refId(row.personId);
    if (pid !== personId) continue;
    if (refId(row.projectId) !== projectId) continue;
    s += Number(row.amount) || 0;
  }
  return s;
}

function pendingRevenueForProject(revenues, projectId) {
  let pending = 0;
  for (const r of revenues) {
    if (refId(r.projectId) !== projectId) continue;
    if (revenueLineStatus(r) !== "Pending") continue;
    const amt = revenueLineAmount(r);
    const pendLine = Number(r.pendingAmount ?? 0) || 0;
    pending += pendLine > 0 ? pendLine : amt;
  }
  return pending;
}

function pendingForPerson(person, projectsById, payouts, revenues) {
  const assigned = Array.isArray(person.assignedProjects) ? person.assignedProjects : [];
  let total = 0;
  for (const raw of assigned) {
    const projectId = refId(raw);
    if (!projectId) continue;
    const project = projectsById.get(projectId);
    const shares = project?.teamMemberShares;
    const contract = contractValue(project);
    if (Array.isArray(shares) && shares.length > 0 && contract > 0) {
      const entry = shares.find((s) => refId(s.peopleId) === String(person._id));
      if (entry) {
        const pct = Math.min(100, Math.max(0, Number(entry.sharePercent) || 0));
        const allocated = (contract * pct) / 100;
        const paid = payoutsForPersonProject(payouts, String(person._id), projectId);
        total += Math.max(0, allocated - paid);
        continue;
      }
    }
    total += pendingRevenueForProject(revenues, projectId);
  }
  return total;
}

function momPct(curr, prev) {
  if (prev == null || !Number.isFinite(prev) || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

/**
 * Aggregate cross-module financial flows for Personal Finance.
 * @param {Date} start
 * @param {Date} end
 * @param {{ prevStart?: Date, prevEnd?: Date }} [opts]
 */
async function computeLinkedFlows(start, end, opts = {}) {
  const [revenues, payouts, projects, people, clients] = await Promise.all([
    Revenue.find().lean(),
    Payout.find().lean(),
    Project.find().select("name clientId totalValue budget teamMemberShares assignedProjects status").lean(),
    People.find().select("name assignedProjects").lean(),
    Client.find().select("name company").lean(),
  ]);

  const projectsById = new Map(projects.map((p) => [String(p._id), p]));
  const clientsById = new Map(clients.map((c) => [String(c._id), c]));
  const peopleById = new Map(people.map((p) => [String(p._id), p]));
  const personalPeople = findPersonalRelatedPeople(people);

  const prevStart = opts.prevStart;
  const prevEnd = opts.prevEnd;

  let rootkitMonth = 0;
  let rootkitPrev = 0;
  let rootkitLineCount = 0;
  let ownerWithdrawalMonth = 0;
  let ownerLineCount = 0;
  let businessToPersonalMonth = 0;
  let businessLineCount = 0;
  let personalPaidMonth = 0;
  let personalPaidAll = 0;
  let personalPaidLines = 0;
  let personalPending = 0;

  const recentEvents = [];

  for (const r of revenues) {
    const projectId = refId(r.projectId);
    const project = projectsById.get(projectId);
    const client = project ? clientsById.get(refId(project.clientId)) : null;
    const event = interpretRevenue(r, { project, client });
    const at = event.at;
    if (!at) continue;

    if (event.bucket === FINANCE_EVENT_BUCKETS.ROOTKIT_INCOME) {
      const received = event.receivedAmount;
      if (inRange(at, start, end)) {
        rootkitMonth += received;
        if (received > 0) rootkitLineCount += 1;
      }
      if (prevStart && prevEnd && inRange(at, prevStart, prevEnd)) {
        rootkitPrev += received;
      }
      if (received > 0) {
        recentEvents.push({
          ...event,
          detail: `₹${Math.round(received).toLocaleString("en-IN")} · ${event.status}`,
        });
      }
    }
  }

  for (const p of payouts) {
    const projectId = refId(p.projectId);
    const project = projectsById.get(projectId);
    const personId = refId(p.peopleId) || refId(p.personId);
    const person = personId ? peopleById.get(personId) : null;
    const event = interpretPayout(p, { project, person });
    const at = event.at;
    if (!at) continue;
    const amt = event.amount;
    if (!amt) continue;

    const inMonth = inRange(at, start, end);

    if (event.bucket === FINANCE_EVENT_BUCKETS.OWNER_WITHDRAWAL && inMonth) {
      ownerWithdrawalMonth += amt;
      ownerLineCount += 1;
      recentEvents.push({
        ...event,
        detail: `${event.bucketLabel} · ₹${Math.round(amt).toLocaleString("en-IN")}`,
      });
    }
    if (event.bucket === FINANCE_EVENT_BUCKETS.BUSINESS_TO_PERSONAL && inMonth) {
      businessToPersonalMonth += amt;
      businessLineCount += 1;
      recentEvents.push({
        ...event,
        detail: `${event.bucketLabel} · ₹${Math.round(amt).toLocaleString("en-IN")}`,
      });
    }
    if (event.bucket === FINANCE_EVENT_BUCKETS.PERSONAL_RELATED_PAYMENT) {
      personalPaidAll += amt;
      personalPaidLines += 1;
      if (inMonth) {
        personalPaidMonth += amt;
        recentEvents.push({
          ...event,
          detail: `${event.personName || "Personal"} · ₹${Math.round(amt).toLocaleString("en-IN")}`,
        });
      }
    }
  }

  for (const person of personalPeople) {
    personalPending += pendingForPerson(person, projectsById, payouts, revenues);
  }

  const primaryPerson = personalPeople[0];
  const personDisplayName =
    primaryPerson?.name ||
    (personalPeople.length > 1 ? "Personal contacts" : "Personal contact");

  recentEvents.sort((a, b) => new Date(b.at) - new Date(a.at));

  const personalWithdrawalsTotal = ownerWithdrawalMonth + businessToPersonalMonth;

  return {
    personalRelatedPeople: personalPeople.map((p) => ({
      id: String(p._id),
      name: p.name || "",
    })),
    cards: {
      rootkitEarnings: {
        label: "Rootkit Earnings",
        amount: rootkitMonth,
        lineCount: rootkitLineCount,
        momPct: momPct(rootkitMonth, rootkitPrev),
      },
      personalWithdrawals: {
        label: "Personal Withdrawals",
        amount: personalWithdrawalsTotal,
        ownerDrawings: ownerWithdrawalMonth,
        businessToPersonal: businessToPersonalMonth,
        lineCount: ownerLineCount + businessLineCount,
      },
      paidToPerson: {
        label: `Paid to ${personDisplayName}`,
        personName: personDisplayName,
        totalPaid: personalPaidAll,
        paidThisMonth: personalPaidMonth,
        pending: personalPending,
        lineCount: personalPaidLines,
      },
      businessToPersonal: {
        label: "Business → Personal Transfers",
        amount: businessToPersonalMonth,
        lineCount: businessLineCount,
      },
    },
    recentEvents: recentEvents.slice(0, 30),
  };
}

module.exports = { computeLinkedFlows };
