/**
 * Minimal CSV → rows. Handles quoted fields with commas.
 * @param {string} text
 * @returns {string[][]}
 */
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cur);
      if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
      row = [];
      cur = "";
    } else {
      cur += c;
    }
  }
  row.push(cur);
  if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findCol(headers, candidates) {
  const norm = headers.map(normalizeHeader);
  for (const cand of candidates) {
    const c = cand.toLowerCase();
    const idx = norm.findIndex((h) => h === c || h.includes(c) || c.includes(h));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseAmountCell(s) {
  if (s == null) return null;
  const t = String(s).trim().replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseDateCell(s) {
  if (!s) return null;
  const t = String(s).trim();
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d;
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, a, b, y] = m;
    let year = Number(y);
    if (year < 100) year += 2000;
    const day = Number(b);
    const month = Number(a) - 1;
    const dt = new Date(year, month, day);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

/**
 * Map CSV rows to statement line objects (pending review).
 * @param {string[][]} rows
 * @returns {{ statementDate: Date|null, description: string, amountSigned: number, raw: string }[]}
 */
function rowsToStatementLines(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((c) => String(c).trim());
  const hasHeader =
    findCol(headers, ["date"]) >= 0 ||
    findCol(headers, ["narration"]) >= 0 ||
    findCol(headers, ["description"]) >= 0 ||
    findCol(headers, ["amount"]) >= 0;

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const h = hasHeader ? headers : null;

  let dateIdx = -1;
  let descIdx = -1;
  let debitIdx = -1;
  let creditIdx = -1;
  let amountIdx = -1;

  if (h) {
    dateIdx = findCol(h, ["date", "txn date", "transaction date", "value date"]);
    descIdx = findCol(h, ["narration", "description", "particulars", "remarks", "details"]);
    debitIdx = findCol(h, ["debit", "withdrawal", "dr"]);
    creditIdx = findCol(h, ["credit", "deposit", "cr"]);
    amountIdx = findCol(h, ["amount", "balance"]);
  }

  const out = [];
  for (let i = 0; i < dataRows.length; i += 1) {
    const cells = dataRows[i].map((c) => String(c).trim());
    const raw = cells.join(" | ");
    if (!cells.some(Boolean)) continue;

    let statementDate = null;
    let description = "";
    let amountSigned = 0;

    if (dateIdx >= 0 && cells[dateIdx]) {
      statementDate = parseDateCell(cells[dateIdx]);
    } else if (cells[0] && parseDateCell(cells[0])) {
      statementDate = parseDateCell(cells[0]);
    }

    if (descIdx >= 0 && cells[descIdx]) {
      description = cells[descIdx];
    } else if (dateIdx !== 0 && cells[1]) {
      description = cells[1];
    } else {
      description = cells.filter(Boolean).slice(1).join(" ") || raw;
    }

    if (debitIdx >= 0 || creditIdx >= 0) {
      const dr = debitIdx >= 0 ? parseAmountCell(cells[debitIdx]) : null;
      const cr = creditIdx >= 0 ? parseAmountCell(cells[creditIdx]) : null;
      if (cr && cr > 0) amountSigned = cr;
      else if (dr && dr > 0) amountSigned = -dr;
    } else if (amountIdx >= 0) {
      const amt = parseAmountCell(cells[amountIdx]);
      if (amt != null) amountSigned = amt;
    } else {
      const last = cells[cells.length - 1];
      const amt = parseAmountCell(last);
      if (amt != null) amountSigned = amt;
    }

    if (!description && !amountSigned && !statementDate) continue;
    out.push({ statementDate, description, amountSigned, raw });
  }
  return out;
}

/**
 * @param {string} csvText
 */
function parseBankCsv(csvText) {
  const rows = parseCsvRows(csvText.replace(/^\uFEFF/, ""));
  return rowsToStatementLines(rows);
}

module.exports = { parseCsvRows, parseBankCsv, rowsToStatementLines };
