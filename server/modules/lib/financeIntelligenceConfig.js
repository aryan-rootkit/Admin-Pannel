/**
 * Configurable rules for unified financial intelligence.
 * Extend arrays here — avoid scattering one-off matchers in controllers or UI.
 */
const FINANCE_LINK_CONFIG = {
  /** People names (normalized lowercase) treated as personal-related payees */
  personalRelatedNames: ["aryan dubey", "aryan"],
  /** Payout category / notes tokens → owner / founder drawings */
  ownerWithdrawalKeywords: [
    "founder",
    "owner",
    "self-transfer",
    "self transfer",
    "withdrawal",
    "drawing",
    "personal transfer",
    "founder payout",
    "owner draw",
    "owner withdrawal",
  ],
  /** Project / client / revenue text → Rootkit business income */
  rootkitKeywords: ["rootkit"],
  /** Explicit business → personal transfer labels */
  businessToPersonalKeywords: [
    "business to personal",
    "biz to personal",
    "transfer to personal",
    "business personal",
  ],
};

/** Canonical buckets returned by classify* helpers */
const FINANCE_EVENT_BUCKETS = {
  ROOTKIT_INCOME: "rootkit_income",
  PERSONAL_RELATED_PAYMENT: "personal_related_payment",
  OWNER_WITHDRAWAL: "owner_withdrawal",
  BUSINESS_TO_PERSONAL: "business_to_personal",
  PROJECT_PAYOUT: "project_payout",
  OPERATING_EXPENSE: "operating_expense",
  OTHER_REVENUE: "other_revenue",
  OTHER_PAYOUT: "other_payout",
};

module.exports = { FINANCE_LINK_CONFIG, FINANCE_EVENT_BUCKETS };
