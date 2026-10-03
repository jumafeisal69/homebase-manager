import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader, Panel } from "@/components/app/Primitives";
import { useCurrentUser } from "@/hooks/useSession";
import { useRows } from "@/lib/db";
import { formatDate, money } from "@/lib/format";
import type { UtilityTxn } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/portal/utilities")({
  head: () => ({
    meta: [
      { title: "My electricity & water — NyumbaPro" },
      { name: "description", content: "Your electricity and water payment history." },
      { property: "og:title", content: "My electricity & water — NyumbaPro" },
      { property: "og:description", content: "Your electricity and water payment history." },
    ],
  }),
  component: PortalUtilities,
});

function List({ rows, dateKey }: { rows: UtilityTxn[]; dateKey: "purchase_date" | "payment_date" }) {
  if (rows.length === 0) return <EmptyState message="Nothing here yet." />;
  return (
    <ul className="divide-y divide-border text-[13px]">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <span>{r.receipt_number} · {formatDate(r[dateKey])}{r.token ? ` · ${r.token}` : ""}</span>
          <span className="ledger-num">{money(r.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

function PortalUtilities() {
  const { data: me } = useCurrentUser();
  const f = [{ col: "tenant_id", value: me?.tenantId }];
  const enabled = Boolean(me?.tenantId);
  const { data: elec = [] } = useRows<UtilityTxn>("electricity_transactions", { filters: f, order: { col: "purchase_date", asc: false }, enabled });
  const { data: water = [] } = useRows<UtilityTxn>("water_transactions", { filters: f, order: { col: "payment_date", asc: false }, enabled });
  return (
    <>
      <PageHeader title="Electricity & Water" />
      <Panel title="Electricity"><List rows={elec} dateKey="purchase_date" /></Panel>
      <Panel title="Water" className="mt-4"><List rows={water} dateKey="payment_date" /></Panel>
    </>
  );
}
