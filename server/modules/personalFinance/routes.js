const express = require("express");
const {
  getSummary,
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  listRepayments,
  addRepayment,
  deleteRepayment,
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  createImport,
  listImports,
  listImportLines,
  approveLine,
  rejectLine,
  getActivity,
} = require("./controller");

const router = express.Router();

router.get("/summary", getSummary);
router.get("/activity", getActivity);

router.get("/transactions", listTransactions);
router.post("/transactions", createTransaction);
router.put("/transactions/:id", updateTransaction);
router.delete("/transactions/:id", deleteTransaction);

router.get("/loans", listLoans);
router.post("/loans", createLoan);
router.put("/loans/:id", updateLoan);
router.delete("/loans/:id", deleteLoan);
router.get("/loans/:id/repayments", listRepayments);
router.post("/loans/:id/repayments", addRepayment);
router.delete("/loans/:id/repayments/:rid", deleteRepayment);

router.get("/subscriptions", listSubscriptions);
router.post("/subscriptions", createSubscription);
router.put("/subscriptions/:id", updateSubscription);
router.delete("/subscriptions/:id", deleteSubscription);

router.post("/imports", createImport);
router.get("/imports", listImports);
router.get("/imports/:id/lines", listImportLines);
router.post("/imports/:id/lines/:lineId/approve", approveLine);
router.post("/imports/:id/lines/:lineId/reject", rejectLine);

module.exports = router;
