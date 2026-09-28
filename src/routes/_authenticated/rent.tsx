import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Receipt as ReceiptIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog, FormDialog } from "@/components/app/FormDialog";
import { ReceiptDialog, type ReceiptData } from "@/components/app/ReceiptDialog";
import { Field, PageHeader, Panel, StatCard, StatusPill } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useProperties, useTenantsList } from "@/hooks/useLookups";
import { logAudit, useRemove, useRows, useSave } from "@/lib/db";
import { exportCsv } from "@/lib/exportCsv";
import { formatDate, money, monthStart, today } from "@/lib/format";
import type { Assignment, RentCharge, RentPayment } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/rent")({
  component: RentPage,
});

function RentPage() {
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenantsList();
  const { data: assignments = [] } = useRows<Assignment>("tenant_assignments", {
    select: "*, rooms(room_number, buildings(name))",
    filters: [{ col: "is_active", value: true }],
  });

  const [fProperty, setFProperty] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const scope = fProperty === "all" ? [] : [{ col: "property_id", value: fProperty }];

  const charges = useRows<RentCharge>("rent_charges", {
    select: "*, tenants(full_name), rooms(room_number)",
    filters: scope,
    order: { col: "period_month", asc: false },
  });
  const payments = useRows<RentPayment>("rent_payments", {
    select: "*, tenants(full_name), rooms(room_number)",
    filters: scope,
    order: { col: "payment_date", asc: false },
  });

  const saveCharge = useSave("rent_charges", "Rent charge");
  const savePayment = useSave("rent_payments", "Payment");
  const removePayment = useRemove("rent_payments", "Payment");
  const removeCharge = useRemove("rent_charges", "Rent charge");

  const [chargeOpen, setChargeOpen] = useState(false);
  const [editCharge, setEditCharge] = useState<RentCharge | null>(null);
  const [chargeForm, setChargeForm] = useState({ tenant_id: "", period_month: monthStart(), amount: "", due_date: today(), notes: "" });

  const [payOpen, setPayOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<RentPayment | null>(null);
  const [payForm, setPayForm] = useState({ tenant_id: "", charge_id: "", amount: "", payment_date: today(), method: "mobile_money", reference: "", notes: "" });

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [deleting, setDeleting] = useState<{ kind: "payment" | "charge"; id: string; label: string } | null>(null);

  const chargeRows = (charges.data ?? []).filter((c) => fStatus === "all" || c.status === fStatus);

  const totals = useMemo(() => {
    const expected = (charges.data ?? []).reduce((s, c) => s + Number(c.amount), 0);
    const collected = (charges.data ?? []).reduce((s, c) => s + Number(c.amount_paid), 0);
    return { expected, collected, outstanding: Math.max(0, expected - collected) };
  }, [charges.data]);

  function openCharge(row?: RentCharge) {
    setEditCharge(row ?? null);
    setChargeForm(
      row
        ? { tenant_id: row.tenant_id, period_month: row.period_month, amount: String(row.amount), due_date: row.due_date, notes: row.notes ?? "" }
        : { tenant_id: "", period_month: monthStart(), amount: "", due_date: today(), notes: "" },
    );
    setChargeOpen(true);
  }

  function submitCharge() {
    const assignment = assignments.find((a) => a.tenant_id === chargeForm.tenant_id);
    if (!chargeForm.tenant_id) {
      toast.error("Choose a tenant.");
      return;
    }
    const amount = Number(chargeForm.amount || assignment?.monthly_rent || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    if (!editCharge && !assignment) {
      toast.error("That tenant has no active room. Assign a room first.");
      return;
    }
    saveCharge.mutate(
      {
        id: editCharge?.id,
        tenant_id: chargeForm.tenant_id,
        property_id: editCharge?.property_id ?? assignment!.property_id,
        room_id: editCharge?.room_id ?? assignment!.room_id,
        period_month: chargeForm.period_month,
        amount,
        due_date: chargeForm.due_date,
        notes: chargeForm.notes || null,
      },
      {
        onSuccess: () => {
          setChargeOpen(false);
          void logAudit(editCharge ? "update" : "create", "rent_charge", `Rent charge ${formatDate(chargeForm.period_month)}`, editCharge?.id);
        },
      },
    );
  }

  function openPayment(row?: RentPayment) {
    setEditPayment(row ?? null);
    setPayForm(
      row
        ? {
            tenant_id: row.tenant_id,
            charge_id: row.charge_id ?? "",
            amount: String(row.amount),
            payment_date: row.payment_date,
            method: row.method,
            reference: row.reference ?? "",
            notes: row.notes ?? "",
          }
        : { tenant_id: "", charge_id: "", amount: "", payment_date: today(), method: "mobile_money", reference: "", notes: "" },
    );
    setPayOpen(true);
  }

  function submitPayment() {
    const charge = (charges.data ?? []).find((c) => c.id === payForm.charge_id);
    const assignment = assignments.find((a) => a.tenant_id === payForm.tenant_id);
    if (!payForm.tenant_id) {
      toast.error("Choose a tenant.");
      return;
    }
    const amount = Number(payForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("A payment must be greater than zero.");
      return;
    }
    const propertyId = charge?.property_id ?? assignment?.property_id ?? editPayment?.property_id;
    if (!propertyId) {
      toast.error("That tenant has no active room or rent charge yet.");
      return;
    }
    savePayment.mutate(
      {
        id: editPayment?.id,
        tenant_id: payForm.tenant_id,
        charge_id: payForm.charge_id || null,
        property_id: propertyId,
        room_id: charge?.room_id ?? assignment?.room_id ?? null,
        amount,
        payment_date: payForm.payment_date,
        method: payForm.method,
        reference: payForm.reference || null,
        notes: payForm.notes || null,
      },
      {
        onSuccess: (row) => {
          setPayOpen(false);
          const saved = row as RentPayment | null;
          void logAudit(editPayment ? "update" : "create", "rent_payment", `Rent payment ${money(amount)}`, saved?.id);
          if (saved && !editPayment) {
            const tenant = tenants.find((t) => t.id === saved.tenant_id);
            setReceipt({
              receiptNumber: saved.receipt_number,
              title: "Rent",
              tenant: tenant?.full_name ?? "Tenant",
              property: properties.find((p) => p.id === saved.property_id)?.name ?? "—",
              room: assignment?.rooms?.room_number ?? "—",
              amount: Number(saved.amount),
              date: saved.payment_date,
              method: saved.method,
              reference: saved.reference,
              description: "Monthly rent payment",
            });
          }
        },
      },
    );
  }

  const chargeColumns: Column<RentCharge>[] = [
    { key: "tenant", header: "Tenant", sortValue: (r) => r.tenants?.full_name ?? "", cell: (r) => <span className="font-medium">{r.tenants?.full_name ?? "—"}</span> },
    { key: "room", header: "Room", cell: (r) => r.rooms?.room_number ?? "—" },
    { key: "month", header: "Month", sortValue: (r) => r.period_month, cell: (r) => formatDate(r.period_month) },
    { key: "amount", header: "Charged", sortValue: (r) => Number(r.amount), cell: (r) => <span className="ledger-num">{money(r.amount)}</span> },
    { key: "paid", header: "Paid", cell: (r) => <span className="ledger-num text-success">{money(r.amount_paid)}</span> },
    {
      key: "balance",
      header: "Balance",
      sortValue: (r) => Number(r.amount) - Number(r.amount_paid),
      cell: (r) => <span className="ledger-num text-destructive">{money(Math.max(0, Number(r.amount) - Number(r.amount_paid)))}</span>,
    },
    { key: "due", header: "Due", cell: (r) => formatDate(r.due_date) },
    { key: "status", header: "Status", cell: (r) => <StatusPill value={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openCharge(r)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => setDeleting({ kind: "charge", id: r.id, label: `rent charge for ${formatDate(r.period_month)}` })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const paymentColumns: Column<RentPayment>[] = [
    { key: "receipt", header: "Receipt", sortValue: (r) => r.receipt_number, cell: (r) => <span className="ledger-num">{r.receipt_number}</span> },
    { key: "tenant", header: "Tenant", cell: (r) => <span className="font-medium">{r.tenants?.full_name ?? "—"}</span> },
    { key: "room", header: "Room", cell: (r) => r.rooms?.room_number ?? "—" },
    { key: "date", header: "Date", sortValue: (r) => r.payment_date, cell: (r) => formatDate(r.payment_date) },
    { key: "amount", header: "Amount", sortValue: (r) => Number(r.amount), cell: (r) => <span className="ledger-num text-success">{money(r.amount)}</span> },
    { key: "method", header: "Method", cell: (r) => r.method.replace("_", " ") },
    { key: "ref", header: "Reference", cell: (r) => r.reference || "—" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setReceipt({
                receiptNumber: r.receipt_number,
                title: "Rent",
                tenant: r.tenants?.full_name ?? "Tenant",
                property: properties.find((p) => p.id === r.property_id)?.name ?? "—",
                room: r.rooms?.room_number ?? "—",
                amount: Number(r.amount),
                date: r.payment_date,
                method: r.method,
                reference: r.reference,
                description: "Monthly rent payment",
              })
            }
          >
            <ReceiptIcon className="size-3.5" /> Receipt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openPayment(r)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting({ kind: "payment", id: r.id, label: `payment ${r.receipt_number}` })}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filterBar = (
    <div className="flex flex-wrap gap-2">
      <Select value={fProperty} onValueChange={setFProperty}>
        <SelectTrigger className="w-[160px]">
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
      <Select value={fStatus} onValueChange={setFStatus}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any status</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partially_paid">Partially paid</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Rent & payments"
        subtitle="Balances are calculated from charges and recorded payments — never typed in by hand."
        actions={
          <>
            <Button variant="outline" onClick={() => openCharge()}>
              <Plus className="size-4" /> Rent charge
            </Button>
            <Button onClick={() => openPayment()}>
              <Plus className="size-4" /> Record payment
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Expected" value={money(totals.expected)} tone="sky" />
        <StatCard label="Collected" value={money(totals.collected)} tone="teal" />
        <StatCard label="Outstanding" value={money(totals.outstanding)} tone="red" />
      </div>

      <Tabs defaultValue="charges" className="mt-6">
        <TabsList>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="charges" className="mt-4">
          <Panel
            action={
              <Button
                size="sm"
                variant="outline"
                disabled={chargeRows.length === 0}
                onClick={() =>
                  exportCsv(
                    "rent-charges",
                    chargeRows.map((c) => ({
                      Tenant: c.tenants?.full_name ?? "",
                      Room: c.rooms?.room_number ?? "",
                      Month: c.period_month,
                      Amount: c.amount,
                      Paid: c.amount_paid,
                      Due: c.due_date,
                      Status: c.status,
                    })),
                  )
                }
              >
                <Download className="size-3.5" /> CSV
              </Button>
            }
            title="Rent charges"
          >
            <DataTable
              rows={chargeRows}
              columns={chargeColumns}
              loading={charges.isLoading}
              error={charges.error ? (charges.error as Error).message : null}
              onRetry={() => void charges.refetch()}
              rowKey={(r) => r.id}
              searchable={(r) => `${r.tenants?.full_name ?? ""} ${r.rooms?.room_number ?? ""} ${r.period_month}`}
              searchPlaceholder="Search charges…"
              toolbar={filterBar}
              emptyMessage="No rent charges yet."
              emptyAction={<Button onClick={() => openCharge()}>Create a rent charge</Button>}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Panel
            title="Payments received"
            action={
              <Button
                size="sm"
                variant="outline"
                disabled={(payments.data ?? []).length === 0}
                onClick={() =>
                  exportCsv(
                    "rent-payments",
                    (payments.data ?? []).map((p) => ({
                      Receipt: p.receipt_number,
                      Tenant: p.tenants?.full_name ?? "",
                      Room: p.rooms?.room_number ?? "",
                      Date: p.payment_date,
                      Amount: p.amount,
                      Method: p.method,
                      Reference: p.reference ?? "",
                    })),
                  )
                }
              >
                <Download className="size-3.5" /> CSV
              </Button>
            }
          >
            <DataTable
              rows={payments.data}
              columns={paymentColumns}
              loading={payments.isLoading}
              error={payments.error ? (payments.error as Error).message : null}
              onRetry={() => void payments.refetch()}
              rowKey={(r) => r.id}
              searchable={(r) => `${r.tenants?.full_name ?? ""} ${r.receipt_number} ${r.reference ?? ""}`}
              searchPlaceholder="Search payments, receipts or references…"
              toolbar={filterBar}
              emptyMessage="No payments recorded yet."
              emptyAction={<Button onClick={() => openPayment()}>Record a payment</Button>}
            />
          </Panel>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={chargeOpen}
        onOpenChange={setChargeOpen}
        title={editCharge ? "Edit rent charge" : "New rent charge"}
        onSubmit={submitCharge}
        saving={saveCharge.isPending}
        savingLabel="Saving charge…"
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tenant" className="sm:col-span-2">
            <Select value={chargeForm.tenant_id} onValueChange={(v) => {
              const a = assignments.find((x) => x.tenant_id === v);
              setChargeForm({ ...chargeForm, tenant_id: v, amount: a ? String(a.monthly_rent) : chargeForm.amount });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Month" hint="Pick any day in the month being charged.">
            <Input type="date" value={chargeForm.period_month} onChange={(e) => setChargeForm({ ...chargeForm, period_month: e.target.value })} />
          </Field>
          <Field label="Due date">
            <Input type="date" value={chargeForm.due_date} onChange={(e) => setChargeForm({ ...chargeForm, due_date: e.target.value })} />
          </Field>
          <Field label="Amount (TZS)" className="sm:col-span-2">
            <Input type="number" min={0} value={chargeForm.amount} onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={chargeForm.notes} onChange={(e) => setChargeForm({ ...chargeForm, notes: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <FormDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        title={editPayment ? "Edit payment" : "Record rent payment"}
        description="Balances and payment status update automatically once you save."
        onSubmit={submitPayment}
        saving={savePayment.isPending}
        savingLabel="Recording payment…"
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tenant">
            <Select value={payForm.tenant_id} onValueChange={(v) => setPayForm({ ...payForm, tenant_id: v, charge_id: "" })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Rent charge" hint="Link the payment so the balance updates.">
            <Select
              value={payForm.charge_id}
              onValueChange={(v) => {
                const c = (charges.data ?? []).find((x) => x.id === v);
                setPayForm({
                  ...payForm,
                  charge_id: v,
                  amount: c ? String(Math.max(0, Number(c.amount) - Number(c.amount_paid))) : payForm.amount,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose month" />
              </SelectTrigger>
              <SelectContent>
                {(charges.data ?? [])
                  .filter((c) => !payForm.tenant_id || c.tenant_id === payForm.tenant_id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {formatDate(c.period_month)} · balance {money(Math.max(0, Number(c.amount) - Number(c.amount_paid)))}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Amount (TZS)">
            <Input type="number" min={1} value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
          </Field>
          <Field label="Payment date">
            <Input type="date" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} />
          </Field>
          <Field label="Method">
            <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="mobile_money">Mobile money</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reference" hint="M-Pesa / Tigo Pesa / bank slip number">
            <Input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ReceiptDialog receipt={receipt} onOpenChange={(v) => !v && setReceipt(null)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this financial record?"
        description={`You are about to permanently delete the ${deleting?.label ?? "record"}. Balances will be recalculated. This cannot be undone.`}
        onConfirm={() => {
          if (!deleting) return;
          const action = deleting.kind === "payment" ? removePayment : removeCharge;
          action.mutate(deleting.id, {
            onSuccess: () => {
              void logAudit("delete", deleting.kind === "payment" ? "rent_payment" : "rent_charge", `Deleted ${deleting.label}`, deleting.id);
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
