/** Download any list of rows as a CSV file the landlord can open in Excel. */
export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Opens the browser print dialog for a receipt; users can "Save as PDF" there. */
export function printElement(html: string, title: string) {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;color:#111;padding:32px;max-width:640px}
    h1{font-size:20px;margin:0 0 2px}
    .muted{color:#666;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
    td{padding:8px 0;border-bottom:1px solid #eee}
    td:last-child{text-align:right;font-weight:600}
    .total{font-size:18px;font-weight:700}
  </style></head><body>${html}</body></html>`);
  doc.close();
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(() => frame.remove(), 1000);
}
