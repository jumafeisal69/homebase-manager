import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { EmptyState, LoadingRows, PageHeader, Panel, StatCard, StatusPill } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useSession";
import { useProperties } from "@/hooks/useLookups";
import { db, useRows } from "@/lib/db";
import { compactMoney, daysBetween, formatDate, money } from "@/lib/format";
import type { Contract, MaintenanceRequest, RentCharge, RentPayment, Room, UtilityTxn } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me, loading } = useCurrentUser();
  const [propertyId, setPropertyId] = useState("all");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [seeding, setSeeding] = useState(false);

  const { data: properties = [] } = useProperties();
  const scope = propertyId === "all" ? [] : [{ col: "property_id", value: propertyId }];

  const { data: rooms = [] } = useRows<Room>("rooms", { filters: scope });
  const { data: charges = [], isLoading: chargesLoading } = useRows<RentCharge>("rent_charges", {
    select: "*, tenants(full_name), rooms(room_number)",
    filters: [...scope, { col: "period_month", op: "gte", value: `${year}-01-01` }, { col: "period_month", op: "lte", value: `${year}-12-31` }],
    order: { col: "period_month", asc: true },
  });
  const { data: payments = [] } = useRows<RentPayment>("rent_payments", {
    select: "*, tenants(full_name), rooms(room_number)",
    filters: [...scope, { col: "payment_date", op: "gte", value: `${year}-01-01` }, { col: "payment_date", op: "lte", value: `${year}-12-31` }],
    order: { col: "payment_date", asc: false },
  });
  const { data: elec = [] } = useRows<UtilityTxn>("electricity_transactions", {
    filters: [...scope, { col: "purchase_date", op: "gte", value: `${year}-01-01` }, { col: "purchase_date", op: "lte", value: `${year}-12-31` }],
  });
  const { data: water = [] } = useRows<UtilityTxn>("water_transactions", {
    filters: [...scope, { col: "payment_date", op: "gte", value: `${year}-01-01` }, { col: "payment_date", op: "lte", value: `${year}-12-31` }],
  });
  const { data: maintenance = [] } = useRows<MaintenanceRequest>("maintenance_requests", {
    select: "*, tenants(full_name), rooms(room_number)",
    filters: scope,
    order: { col: "created_at", asc: false },
  });
  const { data: contracts = [] } = useRows<Contract>("contracts", {
    select: "*, tenants(full_name)",
    filters: scope,
  });

  const stats = useMemo(() => {
    const expected = charges.reduce((s, c) => s + Number(c.amount), 0);
    const collected = charges.reduce((s, c) => s + Number(c.amount_paid), 0);
    return {
      properties: properties.length,
      rooms: rooms.length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      vacant: rooms.filter((r) => r.status === "vacant").length,
      expected,
      collected,
      outstanding: Math.max(0, expected - collected),
      elec: elec.reduce((s, t) => s + Number(t.amount), 0),
      water: water.reduce((s, t) => s + Number(t.amount), 0),
      maintenance: maintenance.reduce((s, m) => s + Number(m.cost), 0),
    };
  }, [charges, properties, rooms, elec, water, maintenance]);

  const chart = useMemo(() => {
    const rows = MONTHS.map((m) => ({ month: m, rent: 0, electricity: 0, water: 0, maintenance: 0 }));
    for (const p of payments) rows[new Date(p.payment_date).getMonth()]!.rent += Number(p.amount);
    for (const t of elec) rows[new Date(t.purchase_date!).getMonth()]!.electricity += Number(t.amount);
    for (const t of water) rows[new Date(t.payment_date!).getMonth()]!.water += Number(t.amount);
    for (const m of maintenance)
      if (m.completed_at && m.completed_at.startsWith(year)) rows[new Date(m.completed_at).getMonth()]!.maintenance += Number(m.cost);
    return rows;
  }, [payments, elec, water, maintenance, year]);

  const occupancy = [
    { name: "Occupied", value: stats.occupied },
    { name: "Vacant", value: stats.vacant },
    { name: "Other", value: Math.max(0, stats.rooms - stats.occupied - stats.vacant) },
  ].filter((d) => d.value > 0);

  const overdue = charges.filter((c) => c.status === "overdue" || c.status === "partially_paid");
  const dueSoon = charges.filter((c) => c.status === "pending" && daysBetween(new Date(), c.due_date) <= 7 && daysBetween(new Date(), c.due_date) >= 0);
  const expiring = contracts.filter((c) => c.status === "expiring_soon" || (c.status === "active" && daysBetween(new Date(), c.end_date) <= 30));
  const openJobs = maintenance.filter((m) => m.status !== "completed" && m.status !== "rejected");

  async function loadDemo() {
    if (seeding) return;
    setSeeding(true);
    try {
      const { error } = await db.rpc("seed_demo_data");
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success("Demo data loaded");
    } catch {
      toast.error("Couldn't load the demo data. Please try again.");
    } finally {
      setSeeding(false);
    }
  }

  if (loading) return <LoadingRows rows={6} />;

  const empty = properties.length === 0;

  return (
    <>
      <PageHeader
        title={`Habari, ${me?.fullName?.split(" ")[0] ?? "there"}`}
        subtitle="Your properties, rent collection and utility spend at a glance."
        actions={
          <>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2].map((i) => {
                  const y = String(new Date().getFullYear() - i);
                  return (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </>
        }
      />

      {empty && (
        <Panel className="mb-6">
          <EmptyState
            message="No properties yet. Add your first property, or load realistic demo data to explore NyumbaPro."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => void navigate({ to: "/properties" })}>Add a property</Button>
                <Button variant="outline" onClick={() => void loadDemo()} disabled={seeding}>
                  {seeding ? "Loading demo data…" : "Load demo data"}
                </Button>
              </div>
            }
          />
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Properties" value={stats.properties} hint={`${stats.rooms} rooms`} tone="amber" />
        <StatCard label="Occupied / Vacant" value={`${stats.occupied} / ${stats.vacant}`} hint="Rooms" tone="olive" />
        <StatCard label={`Expected rent ${year}`} value={money(stats.expected)} tone="sky" />
        <StatCard label="Collected" value={money(stats.collected)} hint={`${stats.expected ? Math.round((stats.collected / stats.expected) * 100) : 0}% of expected`} tone="teal" />
        <StatCard label="Outstanding" value={money(stats.outstanding)} tone="red" />
        <StatCard label="Electricity" value={money(stats.elec)} tone="amber" />
        <StatCard label="Water" value={money(stats.water)} tone="sky" />
        <StatCard label="Maintenance" value={money(stats.maintenance)} tone="olive" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title={`Money in and out · ${year}`} className="lg:col-span-2">
          <div className="h-[320px] p-4">
            {chargesLoading ? (
              <LoadingRows rows={4} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => compactMoney(v as number)} width={60} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                    formatter={(v) => money(v as number)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="rent" name="Rent collected" fill="var(--success)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="electricity" name="Electricity" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="water" name="Water" fill="var(--info)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="maintenance" name="Maintenance" fill="var(--destructive)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Occupancy">
          <div className="h-[320px] p-4">
            {occupancy.length === 0 ? (
              <EmptyState message="Add rooms to see occupancy." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancy} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                    {occupancy.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.name === "Occupied" ? "var(--success)" : entry.name === "Vacant" ? "var(--olive)" : "var(--primary)"}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Needs your attention">
          <ul className="divide-y divide-border text-[13px]">
            <Alert to="/rent" label="Rent overdue or part-paid" count={overdue.length} tone="text-destructive" />
            <Alert to="/rent" label="Rent due within 7 days" count={dueSoon.length} tone="text-primary" />
            <Alert to="/contracts" label="Contracts expiring within 30 days" count={expiring.length} tone="text-primary" />
            <Alert to="/maintenance" label="Open maintenance requests" count={openJobs.length} tone="text-info" />
          </ul>
        </Panel>

        <Panel title="Recent rent payments" action={<Link to="/rent" className="text-[12px] text-muted-foreground hover:text-foreground">View all</Link>}>
          {payments.length === 0 ? (
            <EmptyState message="No rent payments recorded yet." />
          ) : (
            <ul className="divide-y divide-border">
              {payments.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.tenants?.full_name ?? "Tenant"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.rooms?.room_number ? `Room ${p.rooms.room_number} · ` : ""}
                      {formatDate(p.payment_date)} · {p.receipt_number}
                    </div>
                  </div>
                  <div className="ledger-num shrink-0 text-right font-medium text-success">{money(p.amount)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Latest maintenance">
          {maintenance.length === 0 ? (
            <EmptyState message="No maintenance requests yet." />
          ) : (
            <ul className="divide-y divide-border">
              {maintenance.slice(0, 5).map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px]">
                  <div className="min-w-0">
                    <div className="truncate">{m.description}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.rooms?.room_number ? `Room ${m.rooms.room_number} · ` : ""}
                      {m.tenants?.full_name ?? "—"} · {formatDate(m.created_at)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill value={m.priority} />
                    <StatusPill value={m.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Alert({ to, label, count, tone }: { to: string; label: string; count: number; tone: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-secondary/50">
        <span>{label}</span>
        <span className={`ledger-num font-display font-semibold ${count > 0 ? tone : "text-muted-foreground"}`}>{count}</span>
      </Link>
    </li>
  );
}
