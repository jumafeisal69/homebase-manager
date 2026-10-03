import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/app/Primitives";
import { useCurrentUser } from "@/hooks/useSession";
import { useRows } from "@/lib/db";
import { formatDate, money } from "@/lib/format";
import type { RentCharge, RentPayment } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/portal/payments")({
  head: () => ({
    meta: [
      { title: "My rent — NyumbaPro" },
      { name: "description", content: "Your rent charges and payment history." },
      { property: "og:title", content: "My rent — NyumbaPro" },
      { property: "og:description", content: "Your rent charges and payment history." },
    ],
  }),
  component: PortalPayments,
});

function PortalPayments() {
  const { data: me } = useCurrentUser();
  const f = [{ col: "tenant_id", value: me?.tenantId }];
  const enabled = Boolean(me?.tenantId);
  const { data: charges = [] } = useRows<RentCharge>("rent_charges", { filters: f, order: { col: "period_month", asc: false }, enabled });
  const { data: payments = [] } = useRows<RentPayment>("rent_payments", { filters: f, order: { col: "payment_date", asc: false }, enabled });

  return (
    <>
      <PageHeader title="Rent & payments" />
      <Panel title="Rent charges">
        {charges.length === 0 ? <EmptyState message="Nothing here yet." /> : (
          <ul className="divide-y divide-border text-[13px]">
            {charges.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span>{formatDate(c.period_month)}</span>
                <span className="flex items-center gap-3"><StatusPill value={c.status} /><span className="ledger-num">{money(c.amount)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Payments received" className="mt-4">
        {payments.length === 0 ? <EmptyState message="Nothing here yet." /> : (
          <ul className="divide-y divide-border text-[13px]">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span>{p.receipt_number} · {formatDate(p.payment_date)}</span>
                <span className="ledger-num text-success">{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
