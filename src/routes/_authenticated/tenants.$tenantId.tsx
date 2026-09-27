import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog, FormDialog } from "@/components/app/FormDialog";
import { EmptyState, Field, LoadingRows, PageHeader, Panel, StatCard, StatusPill } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { logAudit, useRow, useRows, useSave } from "@/lib/db";
import { exportCsv } from "@/lib/exportCsv";
import { formatDate, formatPhone, money, today } from "@/lib/format";
import type {
  Assignment,
  AuditLog,
  Contract,
  MaintenanceRequest,
  RentCharge,
  RentPayment,
  Tenant,
  UtilityTxn,
} from "@/lib/types";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  component: TenantProfile,
});

function TenantProfile() {
  const { tenantId } = Route.useParams();
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useRow<Tenant>("tenants", tenantId);
  const filters = [{ col: "tenant_id", value: tenantId }];

  const { data: assignments = [] } = useRows<Assignment>("tenant_assignments", {
    select: "*, rooms(room_number, buildings(name)), properties:property_id(name)",
    filters,
    order: { col: "move_in_date", asc: false },
  });
  const { data: charges = [] } = useRows<RentCharge>("rent_charges", { filters, order: { col: "period_month", asc: false } });
  const { data: payments = [] } = useRows<RentPayment>("rent_payments", { filters, order: { col: "payment_date", asc: false } });
  const { data: elec = [] } = useRows<UtilityTxn>("electricity_transactions", { filters, order: { col: "purchase_date", asc: false } });
  const { data: water = [] } = useRows<UtilityTxn>("water_transactions", { filters, order: { col: "payment_date", asc: false } });
  const { data: jobs = [] } = useRows<MaintenanceRequest>("maintenance_requests", { filters, order: { col: "created_at", asc: false } });
  const { data: contracts = [] } = useRows<Contract>("contracts", { filters, order: { col: "end_date", asc: false } });
  const { data: activity = [] } = useRows<AuditLog>("audit_logs", {
    filters: [{ col: "entity_id", value: tenantId }],
    order: { col: "created_at", asc: false },
    limit: 20,
  });

  const saveAssignment = useSave("tenant_assignments", "Move-out");
  const [moveOut, setMoveOut] = useState(false);
  const [moveForm, setMoveForm] = useState({ move_out_date: today(), deposit_refunded: "", move_out_notes: "" });

  const active = assignments.find((a) => a.is_active);
  const expected = charges.reduce((s, c) => s + Number(c.amount), 0);
  const paid = charges.reduce((s, c) => s + Number(c.amount_paid), 0);
  const balance = Math.max(0, expected - paid);

  if (isLoading) return <LoadingRows rows={6} />;
  if (!tenant)
    return (
      <Panel>
        <EmptyState message="That tenant no longer exists." action={<Button onClick={() => void navigate({ to: "/tenants" })}>Back to tenants</Button>} />
      </Panel>
    );

  function submitMoveOut() {
    if (!active) return;
    saveAssignment.mutate(
      {
        id: active.id,
        is_active: false,
        move_out_date: moveForm.move_out_date,
        deposit_refunded: Number(moveForm.deposit_refunded || 0),
        move_out_notes: moveForm.move_out_notes || null,
      },
      {
        onSuccess: () => {
          setMoveOut(false);
          void logAudit("move_out", "tenant", `${tenant!.full_name} moved out`, tenant!.id);
          toast.success("Move-out recorded. The room is now vacant.");
        },
      },
    );
  }

  return (
    <>
      <Link to="/tenants" className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All tenants
      </Link>

      <PageHeader
        title={tenant.full_name}
        subtitle={`${formatPhone(tenant.phone) || "No phone"} · ${tenant.email || "No email"}`}
        actions={
          active ? (
            <Button variant="outline" onClick={() => setMoveOut(true)}>
              Record move-out
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current room" value={active ? `${active.rooms?.buildings?.name ?? ""} ${active.rooms?.room_number ?? ""}`.trim() : "Not assigned"} tone="sky" />
        <StatCard label="Monthly rent" value={money(active?.monthly_rent ?? 0)} tone="amber" />
        <StatCard label="Total paid" value={money(paid)} tone="teal" />
        <StatCard label="Outstanding balance" value={money(balance)} hint="Charges minus payments" tone="red" />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="profile">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="rent">Rent</TabsTrigger>
            <TabsTrigger value="electricity">Electricity</TabsTrigger>
            <TabsTrigger value="water">Water</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Panel title="Personal details">
              <dl className="grid gap-x-8 gap-y-3 p-5 text-[13px] sm:grid-cols-2">
                <Detail label="National ID" value={tenant.national_id} />
                <Detail label="Gender" value={tenant.gender} />
                <Detail label="Date of birth" value={tenant.date_of_birth ? formatDate(tenant.date_of_birth) : null} />
                <Detail label="Date joined" value={formatDate(tenant.date_joined)} />
                <Detail label="Emergency contact" value={tenant.emergency_contact} />
                <Detail label="Emergency phone" value={formatPhone(tenant.emergency_phone)} />
                <Detail label="Home address" value={tenant.address} />
                <Detail label="Status" value={tenant.status} />
              </dl>
            </Panel>
            <Panel title="Room history" className="mt-4">
              {assignments.length === 0 ? (
                <EmptyState message="This tenant has never been assigned a room." />
              ) : (
                <ul className="divide-y divide-border text-[13px]">
                  {assignments.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                      <div>
                        <div className="font-medium">
                          {a.rooms?.buildings?.name} {a.rooms?.room_number}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatDate(a.move_in_date)} → {a.move_out_date ? formatDate(a.move_out_date) : "present"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="ledger-num">{money(a.monthly_rent)}</span>
                        <StatusPill value={a.is_active ? "active" : "moved_out"} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="rent" className="mt-4 space-y-4">
            <History
              title="Rent charges"
              rows={charges.map((c) => ({
                Month: formatDate(c.period_month),
                Amount: c.amount,
                Paid: c.amount_paid,
                Due: c.due_date,
                Status: c.status,
              }))}
              filename={`${tenant.full_name}-rent-charges`}
              render={charges.map((c) => ({
                id: c.id,
                left: formatDate(c.period_month),
                sub: `Due ${formatDate(c.due_date)} · paid ${money(c.amount_paid)}`,
                right: money(c.amount),
                pill: c.status,
              }))}
            />
            <History
              title="Rent payments"
              rows={payments.map((p) => ({
                Receipt: p.receipt_number,
                Date: p.payment_date,
                Amount: p.amount,
                Method: p.method,
                Reference: p.reference ?? "",
              }))}
              filename={`${tenant.full_name}-rent-payments`}
              render={payments.map((p) => ({
                id: p.id,
                left: p.receipt_number,
                sub: `${formatDate(p.payment_date)} · ${p.method.replace("_", " ")}`,
                right: money(p.amount),
              }))}
            />
          </TabsContent>

          <TabsContent value="electricity" className="mt-4">
            <History
              title="Electricity purchases"
              rows={elec.map((t) => ({
                Receipt: t.receipt_number,
                Date: t.purchase_date ?? "",
                Amount: t.amount,
                Units: t.units ?? "",
                Token: t.token ?? "",
                Source: t.source,
              }))}
              filename={`${tenant.full_name}-electricity`}
              render={elec.map((t) => ({
                id: t.id,
                left: t.receipt_number,
                sub: `${formatDate(t.purchase_date)} · ${t.units ?? 0} kWh · ${t.source === "api" ? "API" : "Manual entry"}`,
                right: money(t.amount),
              }))}
            />
          </TabsContent>

          <TabsContent value="water" className="mt-4">
            <History
              title="Water payments"
              rows={water.map((t) => ({
                Receipt: t.receipt_number,
                Date: t.payment_date ?? "",
                Amount: t.amount,
                Units: t.units ?? "",
                Source: t.source,
              }))}
              filename={`${tenant.full_name}-water`}
              render={water.map((t) => ({
                id: t.id,
                left: t.receipt_number,
                sub: `${formatDate(t.payment_date)} · ${t.units ?? 0} units · ${t.source === "api" ? "API" : "Manual entry"}`,
                right: money(t.amount),
              }))}
            />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-4">
            <History
              title="Maintenance requests"
              rows={jobs.map((j) => ({ Date: j.created_at, Category: j.category, Description: j.description, Status: j.status, Cost: j.cost }))}
              filename={`${tenant.full_name}-maintenance`}
              render={jobs.map((j) => ({
                id: j.id,
                left: j.description,
                sub: `${j.category} · ${formatDate(j.created_at)}`,
                right: money(j.cost),
                pill: j.status,
              }))}
            />
          </TabsContent>

          <TabsContent value="contracts" className="mt-4">
            <History
              title="Contracts"
              rows={contracts.map((c) => ({ Start: c.start_date, End: c.end_date, Rent: c.monthly_rent, Deposit: c.deposit, Status: c.status }))}
              filename={`${tenant.full_name}-contracts`}
              render={contracts.map((c) => ({
                id: c.id,
                left: `${formatDate(c.start_date)} → ${formatDate(c.end_date)}`,
                sub: `Deposit ${money(c.deposit)}`,
                right: money(c.monthly_rent),
                pill: c.status,
              }))}
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Panel title="Account activity">
              {activity.length === 0 ? (
                <EmptyState message="No recorded activity yet." />
              ) : (
                <ul className="divide-y divide-border text-[13px]">
                  {activity.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span>{a.description ?? a.action}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <FormDialog
        open={moveOut}
        onOpenChange={setMoveOut}
        title="Record move-out"
        description="The room becomes vacant. Outstanding balances stay on record."
        onSubmit={submitMoveOut}
        saving={saveAssignment.isPending}
        savingLabel="Recording move-out…"
        submitLabel="Record move-out"
      >
        <Field label="Move-out date">
          <Input type="date" value={moveForm.move_out_date} onChange={(e) => setMoveForm({ ...moveForm, move_out_date: e.target.value })} />
        </Field>
        <Field label="Deposit refunded (TZS)" hint={`Outstanding rent balance: ${money(balance)}`}>
          <Input type="number" min={0} value={moveForm.deposit_refunded} onChange={(e) => setMoveForm({ ...moveForm, deposit_refunded: e.target.value })} />
        </Field>
        <Field label="Damages and notes">
          <Textarea rows={3} value={moveForm.move_out_notes} onChange={(e) => setMoveForm({ ...moveForm, move_out_notes: e.target.value })} />
        </Field>
      </FormDialog>

      <ConfirmDialog open={false} onOpenChange={() => {}} title="" description="" onConfirm={() => {}} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value || "—"}</dd>
    </div>
  );
}

function History({
  title,
  rows,
  filename,
  render,
}: {
  title: string;
  rows: Record<string, unknown>[];
  filename: string;
  render: { id: string; left: string; sub: string; right: string; pill?: string }[];
}) {
  return (
    <Panel
      title={title}
      action={
        <Button size="sm" variant="outline" disabled={rows.length === 0} onClick={() => exportCsv(filename, rows)}>
          <Download className="size-3.5" /> CSV
        </Button>
      }
    >
      {render.length === 0 ? (
        <EmptyState message="Nothing recorded yet." />
      ) : (
        <ul className="divide-y divide-border text-[13px]">
          {render.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{r.left}</div>
                <div className="text-[11px] text-muted-foreground">{r.sub}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {r.pill && <StatusPill value={r.pill} />}
                <span className="ledger-num">{r.right}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
