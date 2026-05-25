const {
  FINANCE_LINK_CONFIG,
  FINANCE_EVENT_BUCKETS,
} = require("./financeIntelligenceConfig");
const {
  revenueReceivedAmount,
  revenueLineDate,
  revenueLineAmount,
  revenueLineStatus,
  isExpensePayout,
} = require("./financeHelpers");

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function containsKeyword(haystack, keywords) {
  const text = normalizeText(haystack);
  if (!text) return false;
  return keywords.some((kw) => text.includes(normalizeText(kw)));
}

function matchesPersonalName(name) {
  const n = normalizeText(name);
  if (!n) return false;
  return FINANCE_LINK_CONFIG.personalRelatedNames.some(
    (pattern) => n === pattern || n.includes(pattern) || pattern.includes(n)
  );
}

function payoutLineDate(doc) {
  return doc.paymentDate || doc.paidAt || doc.createdAt;
}

function refId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v._id) return String(v._id);
  return "";
}

/**
 * @param {{ name?: string, company?: string }} [client]
 * @param {{ name?: string }} [project]
 */
function isRootkitContext(project, client, extraText) {
  const parts = [project?.name, client?.name, client?.company, extraText].filter(Boolean);
  return parts.some((p) => containsKeyword(p, FINANCE_LINK_CONFIG.rootkitKeywords));
}

function isOwnerWithdrawalPayout(payout) {
  const cat = payout.category || "";
  const notes = payout.notes || payout.name || "";
  const combined = `${cat} ${notes}`;
  if (containsKeyword(combined, FINANCE_LINK_CONFIG.ownerWithdrawalKeywords)) return true;
  if (!refId(payout.peopleId) && !refId(payout.personId) && !refId(payout.projectId)) {
    if (containsKeyword(combined, ["self", "personal", "founder", "owner"])) return true;
  }
  return false;
}

function isBusinessToPersonalPayout(payout) {
  const combined = `${payout.category || ""} ${payout.notes || ""} ${payout.name || ""}`;
  return containsKeyword(combined, FINANCE_LINK_CONFIG.businessToPersonalKeywords);
}

/**
 * Classify a revenue line for personal-finance linking.
 * @returns {typeof FINANCE_EVENT_BUCKETS[keyof typeof FINANCE_EVENT_BUCKETS]}
 */
function classifyRevenue(revenue, ctx = {}) {
  if (isRootkitContext(ctx.project, ctx.client, revenue.description)) {
    return FINANCE_EVENT_BUCKETS.ROOTKIT_INCOME;
  }
  return FINANCE_EVENT_BUCKETS.OTHER_REVENUE;
}

/**
 * Classify a payout line for personal-finance linking.
 */
function classifyPayout(payout, ctx = {}) {
  if (payout.type === "subscription") return FINANCE_EVENT_BUCKETS.OPERATING_EXPENSE;
  if (isExpensePayout(payout)) return FINANCE_EVENT_BUCKETS.OPERATING_EXPENSE;
  if (isBusinessToPersonalPayout(payout)) return FINANCE_EVENT_BUCKETS.BUSINESS_TO_PERSONAL;
  if (isOwnerWithdrawalPayout(payout)) return FINANCE_EVENT_BUCKETS.OWNER_WITHDRAWAL;
  if (ctx.person && matchesPersonalName(ctx.person.name)) {
    return FINANCE_EVENT_BUCKETS.PERSONAL_RELATED_PAYMENT;
  }
  if (refId(payout.projectId)) return FINANCE_EVENT_BUCKETS.PROJECT_PAYOUT;
  return FINANCE_EVENT_BUCKETS.OTHER_PAYOUT;
}

function bucketLabel(bucket) {
  const map = {
    [FINANCE_EVENT_BUCKETS.ROOTKIT_INCOME]: "Rootkit income",
    [FINANCE_EVENT_BUCKETS.PERSONAL_RELATED_PAYMENT]: "Personal related payment",
    [FINANCE_EVENT_BUCKETS.OWNER_WITHDRAWAL]: "Owner withdrawal",
    [FINANCE_EVENT_BUCKETS.BUSINESS_TO_PERSONAL]: "Business → personal",
    [FINANCE_EVENT_BUCKETS.PROJECT_PAYOUT]: "Project payout",
    [FINANCE_EVENT_BUCKETS.OPERATING_EXPENSE]: "Operating expense",
    [FINANCE_EVENT_BUCKETS.OTHER_REVENUE]: "Revenue",
    [FINANCE_EVENT_BUCKETS.OTHER_PAYOUT]: "Payout",
  };
  return map[bucket] || bucket;
}

function activityTitleForEvent(event) {
  switch (event.bucket) {
    case FINANCE_EVENT_BUCKETS.ROOTKIT_INCOME:
      return `Rootkit payment received · ${event.contextLabel || "Project"}`;
    case FINANCE_EVENT_BUCKETS.PERSONAL_RELATED_PAYMENT:
      return `Payment to ${event.personName || "personal contact"}`;
    case FINANCE_EVENT_BUCKETS.OWNER_WITHDRAWAL:
      return "Founder / owner withdrawal";
    case FINANCE_EVENT_BUCKETS.BUSINESS_TO_PERSONAL:
      return "Business → personal transfer";
    case FINANCE_EVENT_BUCKETS.PROJECT_PAYOUT:
      return `Payout · ${event.contextLabel || "Project"}`;
    default:
      return event.sourceType === "revenue" ? "Payment received" : "Payout recorded";
  }
}

/**
 * Build a normalized finance event from revenue or payout.
 */
function interpretRevenue(revenue, ctx = {}) {
  const bucket = classifyRevenue(revenue, ctx);
  const received = revenueReceivedAmount(revenue);
  const status = revenueLineStatus(revenue);
  const amount = revenueLineAmount(revenue);
  return {
    id: `rev-${revenue._id}`,
    sourceType: "revenue",
    sourceId: String(revenue._id),
    bucket,
    bucketLabel: bucketLabel(bucket),
    at: revenueLineDate(revenue),
    amount,
    receivedAmount: received,
    status,
    flow: "in",
    contextLabel: ctx.project?.name || ctx.client?.name || "",
    personName: null,
    projectId: refId(revenue.projectId),
    peopleId: null,
    title: activityTitleForEvent({
      bucket,
      sourceType: "revenue",
      contextLabel: ctx.project?.name || ctx.client?.name,
    }),
  };
}

function interpretPayout(payout, ctx = {}) {
  const bucket = classifyPayout(payout, ctx);
  const amount = Math.max(0, Number(payout.amount) || 0);
  return {
    id: `pay-${payout._id}`,
    sourceType: "payout",
    sourceId: String(payout._id),
    bucket,
    bucketLabel: bucketLabel(bucket),
    at: payoutLineDate(payout),
    amount,
    receivedAmount: amount,
    status: "paid",
    flow: "out",
    contextLabel: ctx.project?.name || payout.category || "",
    personName: ctx.person?.name || null,
    projectId: refId(payout.projectId),
    peopleId: refId(payout.peopleId) || refId(payout.personId),
    title: activityTitleForEvent({
      bucket,
      sourceType: "payout",
      contextLabel: ctx.project?.name,
      personName: ctx.person?.name,
    }),
  };
}

function inRange(dateVal, start, end) {
  if (!dateVal) return false;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(d.getTime())) return false;
  return d >= start && d < end;
}

function findPersonalRelatedPeople(peopleList) {
  return (peopleList || []).filter((p) => matchesPersonalName(p.name));
}

module.exports = {
  FINANCE_LINK_CONFIG,
  FINANCE_EVENT_BUCKETS,
  normalizeText,
  matchesPersonalName,
  isRootkitContext,
  isOwnerWithdrawalPayout,
  isBusinessToPersonalPayout,
  classifyRevenue,
  classifyPayout,
  interpretRevenue,
  interpretPayout,
  payoutLineDate,
  refId,
  inRange,
  findPersonalRelatedPeople,
  bucketLabel,
  activityTitleForEvent,
};
