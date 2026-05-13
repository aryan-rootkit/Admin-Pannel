"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { glassCard, sectionLabel, sectionTitle } from "@/components/dashboard/dashboardStyles";
import type { PfStatementImportRow, PfStatementLineRow } from "@/types/personalFinance";
import { PF_EXPENSE_CATEGORIES } from "@/types/personalFinance";

type Props = {
  imports: PfStatementImportRow[];
  lines: PfStatementLineRow[];
  selectedImportId: string | null;
  onSelectImport: (id: string | null) => void;
  onUpload: (csvText: string, fileName: string) => Promise<void>;
  onApprove: (lineId: string, category: string, title: string) => Promise<void>;
  onReject: (lineId: string) => Promise<void>;
  busy?: boolean;
};

export function PfImportSection({
  imports,
  lines,
  selectedImportId,
  onSelectImport,
  onUpload,
  onApprove,
  onReject,
  busy,
}: Props) {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("statement.csv");
  const [catByLine, setCatByLine] = useState<Record<string, string>>({});
  const [titleByLine, setTitleByLine] = useState<Record<string, string>>({});

  const pending = lines.filter((l) => l.status === "pending");

  return (
    <div className={`${glassCard} p-5 md:p-6`}>
      <p className={sectionLabel}>Bank import</p>
      <h3 className={`${sectionTitle} mt-1`}>CSV statement → review → approve</h3>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Paste CSV (exported from your bank). Parsed rows stay pending until you assign a category and approve — nothing hits your ledger automatically.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">File name (label only)</label>
          <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="statement.csv" />
          <label className="text-xs font-semibold text-slate-600">CSV contents</label>
          <textarea
            className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none ring-slate-200 focus:ring-2"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV here…"
          />
          <Button
            type="button"
            disabled={busy || !csvText.trim()}
            className="rounded-full"
            onClick={async () => {
              await onUpload(csvText, fileName);
              setCsvText("");
            }}
          >
            Parse & queue for review
          </Button>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Review import batch</label>
          <Select
            className="mt-1"
            value={selectedImportId || ""}
            onChange={(e) => onSelectImport(e.target.value || null)}
          >
            <option value="">Select import…</option>
            {imports.map((im) => (
              <option key={im._id} value={im._id}>
                {im.fileName || "import"} · {im.rowCount ?? 0} rows · {formatDate(im.createdAt)}
              </option>
            ))}
          </Select>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Supported headers include Date, Narration/Description, Debit, Credit, or a single Amount column. Tune the CSV export if dates do not parse.
          </p>
        </div>
      </div>

      {selectedImportId && pending.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Signed amt</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Title override</th>
                <th className="px-3 py-2 w-36" />
              </tr>
            </thead>
            <tbody>
              {pending.map((l) => (
                <tr key={l._id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs text-slate-600">{l.statementDate ? formatDate(l.statementDate) : "—"}</td>
                  <td className="max-w-[220px] px-3 py-2 text-xs text-slate-800">
                    <span className="line-clamp-2">{l.description || l.raw}</span>
                  </td>
                  <td
                    className={`px-3 py-2 text-right text-xs font-semibold tabular-nums ${
                      l.amountSigned >= 0 ? "text-emerald-800" : "text-rose-800"
                    }`}
                  >
                    {l.amountSigned >= 0 ? "+" : ""}
                    {formatMoney(Math.abs(l.amountSigned), "INR")}
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={catByLine[l._id] || "misc"}
                      onChange={(e) => setCatByLine((m) => ({ ...m, [l._id]: e.target.value }))}
                    >
                      {PF_EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="optional"
                      value={titleByLine[l._id] || ""}
                      onChange={(e) => setTitleByLine((m) => ({ ...m, [l._id]: e.target.value }))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1 sm:flex-row">
                      <Button
                        type="button"
                        className="min-h-9 rounded-full px-3 py-1.5 text-xs"
                        disabled={busy}
                        onClick={() =>
                          onApprove(l._id, catByLine[l._id] || "misc", titleByLine[l._id] || l.description || "")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-9 rounded-full px-3 py-1.5 text-xs"
                        disabled={busy}
                        onClick={() => onReject(l._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedImportId ? (
        <p className="mt-4 text-sm text-slate-500">No pending lines in this import.</p>
      ) : null}
    </div>
  );
}
