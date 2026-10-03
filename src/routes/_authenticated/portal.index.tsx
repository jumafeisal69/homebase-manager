import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader, Panel, StatCard, StatusPill } from "@/components/app/Primitives";
import { useCurrentUser } from "@/hooks/useSession";
import { useRows } from "@/lib/db";
import { formatDate, money, monthStart } from "@/lib/format";
import type { Assignment, MaintenanceRequest, RentCharge, RentPayment, UtilityTxn } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({
    meta: [
      { title: "My home — NyumbaPro" },
      { name: "description", content: "Your room, rent balance, payments and requests." },
      { property: "og:title", content: "My home — NyumbaPro" },
      { property: "og:description", content: "Your room, rent balance, payments and requests." },
    ],
  }),
  component: PortalHome,
});

function PortalHome() {
  const { data: me } = useCurrentUser();
  const tid = me?.tenantId;
  const f = [{ col: "tenant_id", value: tid }];
  const enabled = Boolean(tid);
  const { data: assignments = [] } = useRows<Assignment>("tenant_assignments", { select: "*, rooms(room_number, buildings(name))", filters: [...f, { col: "is_active", value: true }], enabled });
  const { data: charges = [] } = useRows<RentCharge>("rent_charges", { filters: f, enabled });
  const { data: payments = [] } = useRows<RentPayment>("rent_payments", { filters: f, order: { col: "payment_date", asc: false }, enabled });
  const { data: elec = [] } = useRows<UtilityTxn>("electricity_transactions", { filters: [...f, { col: "purchase_date", op: "gte", value: monthStart() }], enabled });
  const { data: water = [] } = useRows<UtilityTxn>("water_transactions", { filters: [...f, { col: "payment_date", op: "gte", value: monthStart() }], enabled });
  const { data: jobs = [] } = useRows<MaintenanceRequest>("maintenance_requests", { filters: f, order: { col: "created_at", asc: false }, enabled });

  if (!tid)
    return (
      <Panel>
        <EmptyState message="Your account isn't linked to a tenancy yet. Ask your landlord to save your email on your tenant profile." />
      </Panel>
    );

  const a = assignments[0];
  const balance = Math.max(0, charges.reduce((s, c) => s + Number(c.amount) - Number(c.amount_paid), 0));
  const sum = (l: UtilityTxn[]) => l.reduce((s, x) => s + Number(x.amount), 0);

  return (
    <>
      <PageHeader title={`Karibu, ${me?.fullName ?? ""}`} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Current room" value={a ? `${a.rooms?.buildings?.name ?? ""} ${a.rooms?.room_number ?? ""}` : "—"} tone="sky" />
        <StatCard label="Monthly rent" value={money(a?.monthly_rent ?? 0)} tone="amber" />
        <StatCard label="Outstanding balance" value={money(balance)} tone="red" />
        <StatCard label="Last payment" value={payments[0] ? money(payments[0].amount) : "—"} hint={payments[0] ? formatDate(payments[0].payment_date) : undefined} tone="teal" />
        <StatCard label="Electricity" value={money(sum(elec))} hint="This month" tone="amber" />
        <StatCard label="Water" value={money(sum(water))} hint="This month" tone="sky" />
      </div>
      <Panel title="Maintenance" className="mt-6">
        {jobs.length === 0 ? (
          <EmptyState message="No maintenance requests." />
        ) : (
          <ul className="divide-y divide-border text-[13px]">
            {jobs.slice(0, 5).map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="truncate">{j.description}</span>
                <StatusPill value={j.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
