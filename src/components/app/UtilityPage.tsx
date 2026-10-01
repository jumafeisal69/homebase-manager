import { Download, Plus, Receipt as ReceiptIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog, FormDialog } from "@/components/app/FormDialog";
import { ReceiptDialog, type ReceiptData } from "@/components/app/ReceiptDialog";
import { Field, PageHeader, Panel, StatCard } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProperties, useRoomsList } from "@/hooks/useLookups";
import { logAudit, useRemove, useRows, useSave } from "@/lib/db";
import { exportCsv } from "@/lib/exportCsv";
import { addMonths, formatDate, money, monthStart, num, today } from "@/lib/format";
import type { Assignment, UtilityTxn } from "@/lib/types";

interface Props {
  kind: "electricity" | "water";
}

export function UtilityPage({ kind }: Props) {
  const isElectricity = kind === "electricity";
  const table = isElectricity ? "electricity_transactions" : "water_transactions";
  const dateCol = isElectricity ? "purchase_date" : "payment_date";
  const label = isElectricity ? "Electricity" : "Water";
  const unitLabel = isElectricity ? "kWh" : "units";

  const { data: properties = [] } = useProperties();
  const { data: rooms = [] } = useRoomsList();
  const { data: assignments = [] } = useRows<Assignment>("tenant_assignments", {
    select: "*, tenants(full_name)",
    filters: [{ col: "is_active", value: true }],
  });

  const [fProperty, setFProperty] = useState("all");
  const [fSource, setFSource] = useState("all");

  const txns = useRows<UtilityTxn>(table, {
    select: "*, tenants(full_name), rooms(room_number)",
    filters: [{ col: "property_id", value: fProperty }],
    order: { col: dateCol, asc: false },
  });

  const save = useSave(table, `${label} transaction`);
  const remove = useRemove(table, `${label} transaction`);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UtilityTxn | null>(null);
  const blank = { room_id: "", meter_number: "", date: today(), amount: "", units: "", token: "", reference: "", method: "mobile_money", notes: "" };
  const [form, setForm] = useState(blank);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [deleting, setDeleting] = useState<UtilityTxn | null>(null);

  const rows = (txns.data ?? []).filter((t) => fSource === "all" || t.source === fSource);

  const totals = useMemo(() => {
    const thisMonth = monthStart();
    const prevMonth = addMonths(thisMonth, -1);
    let current = 0;
    let previous = 0;
    let all = 0;
    for (const t of rows) {
      const d = (isElectricity ? t.purchase_date : t.payment_date) ?? "";
      const amount = Number(t.amount);
      all += amount;
      if (d >= thisMonth) current += amount;
      else if (d >= prevMonth) previous += amount;
    }
    return { current, previous, all };
  }, [rows, isElectricity]);

  function openForm(row?: UtilityTxn) {
    setEditing(row ?? null);
    setForm(
      row
        ? {
            room_id: row.room_id ?? "",
            meter_number: row.meter_number ?? "",
            date: (isElectricity ? row.purchase_date : row.payment_date) ?? today(),
            amount: String(row.amount),
            units: row.units === null || row.units === undefined ? "" : String(row.units),
            token: row.token ?? "",
            reference: row.reference ?? "",
            method: row.method,
            notes: row.notes ?? "",
          }
        : blank,
    );
    setOpen(true);
  }

  function submit() {
    const room = rooms.find((r) => r.id === form.room_id);
    if (!room) {
      toast.error("Choose a room.");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    const assignment = assignments.find((a) => a.room_id === room.id);
    save.mutate(
      {
        id: editing?.id,
        property_id: room.property_id,
        room_id: room.id,
        tenant_id: assignment?.tenant_id ?? null,
        meter_number: form.meter_number || (isElectricity ? room.electricity_meter : room.water_meter) || null,
        [dateCol]: form.date,
        amount,
        units: form.units === "" ? null : Number(form.units),
        ...(isElectricity ? { token: form.token || null } : {}),
        reference: form.reference || null,
        method: form.method,
        notes: form.notes || null,
        source: "manual",
      },
      {
        onSuccess: (saved) => {
          setOpen(false);
          const row = saved as UtilityTxn | null;
          void logAudit(editing ? "update" : "create", kind, `${label} ${money(amount)} for room ${room.room_number}`, row?.id);
          if (row && !editing) {
            setReceipt({
              receiptNumber: row.receipt_number,
              title: label,
              tenant: assignment?.tenants?.full_name ?? "—",
              property: properties.find((p) => p.id === room.property_id)?.name ?? "—",
              room: room.room_number,
              amount,
              date: form.date,
              method: form.method,
              reference: form.reference,
              description: `${label} purchase${form.units ? ` · ${form.units} ${unitLabel}` : ""}`,
            });
          }
        },
      },
    );
  }

  const columns: Column<UtilityTxn>[] = [
    { key: "receipt", header: "Receipt", sortValue: (r) => r.receipt_number, cell: (r) => <span className="ledger-num">{r.receipt_number}</span> },
    { key: "room", header: "Room", cell: (r) => r.rooms?.room_number ?? "—" },
    { key: "tenant", header: "Tenant", cell: (r) => r.tenants?.full_name ?? "—" },
    { key: "meter", header: "Meter", cell: (r) => r.meter_number || "—" },
    {
      key: "date",
      header: "Date",
      sortValue: (r) => (isElectricity ? r.purchase_date : r.payment_date) ?? "",
      cell: (r) => formatDate(isElectricity ? r.purchase_date : r.payment_date),
    },
    { key: "units", header: unitLabel, cell: (r) => (r.units === null || r.units === undefined ? "—" : num(r.units)) },
    { key: "amount", header: "Amount", sortValue: (r) => Number(r.amount), cell: (r) => <span className="ledger-num">{money(r.amount)}</span> },
    {
      key: "source",
      header: "Entry",
      cell: (r) => (
        <span className="text-[11px] text-muted-foreground">{r.source === "api" ? "From provider API" : "Manual entry"}</span>
      ),
    },
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
                title: label,
                tenant: r.tenants?.full_name ?? "—",
                property: properties.find((p) => p.id === r.property_id)?.name ?? "—",
                room: r.rooms?.room_number ?? "—",
                amount: Number(r.amount),
                date: (isElectricity ? r.purchase_date : r.payment_date) ?? today(),
                method: r.method,
                reference: r.reference,
                description: `${label} purchase`,
              })
            }
          >
            <ReceiptIcon className="size-3.5" /> Receipt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openForm(r)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(r)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`${label} payments`}
        subtitle={`Every ${label.toLowerCase()} record you add here is a manual entry. Automatic provider feeds are not connected yet.`}
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="size-4" /> Record {label.toLowerCase()}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="This month" value={money(totals.current)} tone={isElectricity ? "amber" : "sky"} />
        <StatCard label="Previous month" value={money(totals.previous)} tone="olive" />
        <StatCard label="All time" value={money(totals.all)} tone="teal" />
      </div>

      <Panel
        className="mt-6"
        title={`${label} transactions`}
        action={
          <Button
            size="sm"
            variant="outline"
            disabled={rows.length === 0}
            onClick={() =>
              exportCsv(
                `${kind}-transactions`,
                rows.map((r) => ({
                  Receipt: r.receipt_number,
                  Room: r.rooms?.room_number ?? "",
                  Tenant: r.tenants?.full_name ?? "",
                  Meter: r.meter_number ?? "",
                  Date: (isElectricity ? r.purchase_date : r.payment_date) ?? "",
                  Units: r.units ?? "",
                  Amount: r.amount,
                  Method: r.method,
                  Reference: r.reference ?? "",
                  Entry: r.source,
                })),
              )
            }
          >
            <Download className="size-3.5" /> CSV
          </Button>
        }
      >
        <DataTable
          rows={rows}
          columns={columns}
          loading={txns.isLoading}
          error={txns.error ? (txns.error as Error).message : null}
          onRetry={() => void txns.refetch()}
          rowKey={(r) => r.id}
          searchable={(r) => `${r.receipt_number} ${r.rooms?.room_number ?? ""} ${r.tenants?.full_name ?? ""} ${r.meter_number ?? ""} ${r.reference ?? ""}`}
          searchPlaceholder="Search receipts, rooms, meters…"
          toolbar={
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
              <Select value={fSource} onValueChange={setFSource}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entries</SelectItem>
                  <SelectItem value="manual">Manual entries</SelectItem>
                  <SelectItem value="api">From provider API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          emptyMessage={`No ${label.toLowerCase()} payments recorded yet.`}
          emptyAction={<Button onClick={() => openForm()}>Record {label.toLowerCase()}</Button>}
        />
      </Panel>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${label.toLowerCase()} record` : `Record ${label.toLowerCase()} payment`}
        onSubmit={submit}
        saving={save.isPending}
        savingLabel="Saving…"
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Room" className="sm:col-span-2">
            <Select
              value={form.room_id}
              onValueChange={(v) => {
                const r = rooms.find((x) => x.id === v);
                setForm({ ...form, room_id: v, meter_number: (isElectricity ? r?.electricity_meter : r?.water_meter) ?? "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.buildings?.name} {r.room_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Meter number">
            <Input value={form.meter_number} onChange={(e) => setForm({ ...form, meter_number: e.target.value })} />
          </Field>
          <Field label={isElectricity ? "Purchase date" : "Payment date"}>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Amount (TZS)">
            <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label={`Units (${unitLabel})`}>
            <Input type="number" min={0} value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
          </Field>
          {isElectricity && (
            <Field label="Token" className="sm:col-span-2">
              <Input value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
            </Field>
          )}
          <Field label="Method">
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
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
          <Field label="Reference">
            <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ReceiptDialog receipt={receipt} onOpenChange={(v) => !v && setReceipt(null)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this financial record?"
        description={`Receipt ${deleting?.receipt_number ?? ""} will be permanently removed. This cannot be undone.`}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              void logAudit("delete", kind, `Deleted ${label.toLowerCase()} receipt ${deleting.receipt_number}`, deleting.id);
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
