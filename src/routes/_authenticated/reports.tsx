import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Field, PageHeader, Panel, StatCard } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties, useRoomsList } from "@/hooks/useLookups";
import { useRows } from "@/lib/db";
import { exportCsv } from "@/lib/exportCsv";
import { addMonths, compactMoney, formatMonth, money, monthStart, today } from "@/lib/format";
import type { Expense, MaintenanceRequest, RentCharge, RentPayment, UtilityTxn } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — NyumbaPro" },
      { name: "description", content: "Rent, utilities, maintenance, occupancy and net income reports for any date range." },
      { property: "og:title", content: "Reports — NyumbaPro" },
      { property: "og:description", content: "Rent, utilities, maintenance, occupancy and net income reports for any date range." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: properties = [] } = useProperties();
  const [property, setProperty] = useState("all");
  const [from, setFrom] = useState(addMonths(monthStart(), -5));
  const [to, setTo] = useState(today());

  const scope = [{ col: "property_id", value: property }];
  const { data: rooms = [] } = useRoomsList({ propertyId: property === "all" ? undefined : property });
  const { data: charges = [] } = useRows<RentCharge>("rent_charges", {
    filters: [...scope, { col: "period_month", op: "gte", value: from }, { col: "period_month", op: "lte", value: to }],
  });
  const { data: payments = [] } = useRows<RentPayment>("rent_payments", {
    filters: [...scope, { col: "payment_date", op: "gte", value: from }, { col: "payment_date", op: "lte", value: to }],
  });
  const { data: elec = [] } = useRows<UtilityTxn>("electricity_transactions", {
    filters: [...scope, { col: "purchase_date", op: "gte", value: from }, { col: "purchase_date", op: "lte", value: to }],
  });
  const { data: water = [] } = useRows<UtilityTxn>("water_transactions", {
    filters: [...scope, { col: "payment_date", op: "gte", value: from }, { col: "payment_date", op: "lte", value: to }],
  });
  const { data: jobs = [] } = useRows<MaintenanceRequest>("maintenance_requests", {
    filters: [...scope, { col: "created_at", op: "gte", value: from }, { col: "created_at", op: "lte", value: `${to}T23:59:59` }],
  });
  const { data: expenses = [] } = useRows<Expense>("expenses", {
    filters: [...scope, { col: "expense_date", op: "gte", value: from }, { col: "expense_date", op: "lte", value: to }],
  });

  const sum = (list: { amount?: number; cost?: number }[], key: "amount" | "cost" = "amount") =>
    list.reduce((s, r) => s + Number(r[key] ?? 0), 0);

  const expected = sum(charges);
  const collected = sum(payments);
  const outstanding = Math.max(0, expected - charges.reduce((s, c) => s + Number(c.amount_paid), 0));
  const elecTotal = sum(elec);
  const waterTotal = sum(water);
  const maintTotal = sum(jobs, "cost");
  const otherExpenses = sum(expenses);
  const net = collected - maintTotal - otherExpenses;
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const occupancy = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; rent: number; electricity: number; water: number; maintenance: number }>();
    const bucket = (date: string | undefined | null) => {
      const key = (date ?? "").slice(0, 7);
      if (!map.has(key)) map.set(key, { month: key, rent: 0, electricity: 0, water: 0, maintenance: 0 });
      return map.get(key)!;
    };
    payments.forEach((p) => (bucket(p.payment_date).rent += Number(p.amount)));
    elec.forEach((e) => (bucket(e.purchase_date).electricity += Number(e.amount)));
    water.forEach((w) => (bucket(w.payment_date).water += Number(w.amount)));
    jobs.forEach((j) => (bucket(j.created_at).maintenance += Number(j.cost)));
    return [...map.values()].filter((m) => m.month).sort((a, b) => a.month.localeCompare(b.month));
  }, [payments, elec, water, jobs]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Choose a date range and property. Every figure comes from your recorded transactions."
        actions={
          <>
            <Button
              variant="outline"
              disabled={monthly.length === 0}
              onClick={() =>
                exportCsv(
                  `nyumbapro-report-${from}-to-${to}`,
                  monthly.map((m) => ({ Month: m.month, Rent: m.rent, Electricity: m.electricity, Water: m.water, Maintenance: m.maintenance })),
                )
              }
            >
              <Download className="size-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
          </>
        }
      />

      <Panel>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <Field label="Property">
            <Select value={property} onValueChange={setProperty}>
              <SelectTrigger>
                <SelectValue />
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
          </Field>
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rent expected" value={money(expected)} tone="sky" />
        <StatCard label="Rent collected" value={money(collected)} tone="teal" />
        <StatCard label="Outstanding" value={money(outstanding)} tone="red" />
        <StatCard label="Occupancy" value={`${occupancy}%`} hint={`${occupied} of ${rooms.length} rooms`} tone="olive" />
        <StatCard label="Electricity" value={money(elecTotal)} tone="amber" />
        <StatCard label="Water" value={money(waterTotal)} tone="sky" />
        <StatCard label="Maintenance + expenses" value={money(maintTotal + otherExpenses)} tone="red" />
        <StatCard label="Net income" value={money(net)} hint="Rent collected minus repairs and expenses" tone="teal" />
      </div>

      <Panel className="mt-6" title="Month by month">
        <div className="h-[320px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(m: string) => formatMonth(`${m}-01`)} stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis tickFormatter={(v: number) => compactMoney(v)} stroke="var(--muted-foreground)" fontSize={11} width={80} />
              <Tooltip
                formatter={(v: number) => money(v)}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="rent" fill="var(--success)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="electricity" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="water" fill="var(--info)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="maintenance" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}
