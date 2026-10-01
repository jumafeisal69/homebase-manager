import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog, FormDialog } from "@/components/app/FormDialog";
import { Field, PageHeader, Panel, StatCard, StatusPill } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProperties, useTenantsList } from "@/hooks/useLookups";
import { logAudit, useRemove, useRows, useSave } from "@/lib/db";
import { addMonths, daysBetween, formatDate, money, today } from "@/lib/format";
import type { Assignment, Contract } from "@/lib/types";
import { openFile, uploadFile } from "@/lib/upload";

export const Route = createFileRoute("/_authenticated/contracts")({
  head: () => ({
    meta: [
      { title: "Contracts — NyumbaPro" },
      { name: "description", content: "Tenancy agreements with start and end dates, deposits and expiry alerts." },
      { property: "og:title", content: "Contracts — NyumbaPro" },
      { property: "og:description", content: "Tenancy agreements with start and end dates, deposits and expiry alerts." },
    ],
  }),
  component: ContractsPage,
});

function ContractsPage() {
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenantsList();
  const { data: assignments = [] } = useRows<Assignment>("tenant_assignments", {
    select: "*",
    filters: [{ col: "is_active", value: true }],
  });

  const [fProperty, setFProperty] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const contracts = useRows<Contract>("contracts", {
    select: "*, tenants(full_name), rooms(room_number)",
    filters: [{ col: "property_id", value: fProperty }],
    order: { col: "end_date", asc: true },
  });

  const save = useSave("contracts", "Contract");
  const remove = useRemove("contracts", "Contract");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const blank = {
    tenant_id: "",
    start_date: today(),
    end_date: addMonths(today(), 12),
    monthly_rent: "",
    deposit: "",
    status: "active",
    document_url: "",
    notes: "",
  };
  const [form, setForm] = useState(blank);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<Contract | null>(null);

  const rows = (contracts.data ?? []).filter((c) => fStatus === "all" || c.status === fStatus);
  const active = rows.filter((c) => c.status === "active").length;
  const expiring = rows.filter((c) => {
    const days = daysBetween(today(), c.end_date);
    return c.status !== "terminated" && days >= 0 && days <= 60;
  }).length;
  const expired = rows.filter((c) => c.status === "expired").length;

  function openForm(row?: Contract) {
    setEditing(row ?? null);
    setForm(
      row
        ? {
            tenant_id: row.tenant_id,
            start_date: row.start_date,
            end_date: row.end_date,
            monthly_rent: String(row.monthly_rent),
            deposit: String(row.deposit),
            status: row.status,
            document_url: row.document_url ?? "",
            notes: row.notes ?? "",
          }
        : blank,
    );
    setOpen(true);
  }

  async function pickDocument(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file, "contracts");
      setForm((f) => ({ ...f, document_url: path }));
      toast.success("Contract document uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!form.tenant_id) {
      toast.error("Choose a tenant.");
      return;
    }
    const assignment = assignments.find((a) => a.tenant_id === form.tenant_id);
    const propertyId = editing?.property_id ?? assignment?.property_id;
    if (!propertyId) {
      toast.error("That tenant has no active room. Assign a room first.");
      return;
    }
    if (form.end_date <= form.start_date) {
      toast.error("The end date must come after the start date.");
      return;
    }
    const rent = Number(form.monthly_rent || assignment?.monthly_rent || 0);
    if (!Number.isFinite(rent) || rent <= 0) {
      toast.error("Enter a monthly rent greater than zero.");
      return;
    }
    save.mutate(
      {
        id: editing?.id,
        tenant_id: form.tenant_id,
        property_id: propertyId,
        room_id: editing?.room_id ?? assignment?.room_id ?? null,
        start_date: form.start_date,
        end_date: form.end_date,
        monthly_rent: rent,
        deposit: Number(form.deposit || assignment?.deposit || 0),
        status: form.status,
        document_url: form.document_url || null,
        notes: form.notes || null,
      },
      {
        onSuccess: (saved) => {
          setOpen(false);
          void logAudit(editing ? "update" : "create", "contract", `Contract ${formatDate(form.start_date)} → ${formatDate(form.end_date)}`, (saved as Contract | null)?.id);
        },
      },
    );
  }

  const columns: Column<Contract>[] = [
    { key: "tenant", header: "Tenant", sortValue: (r) => r.tenants?.full_name ?? "", cell: (r) => <span className="font-medium">{r.tenants?.full_name ?? "—"}</span> },
    { key: "room", header: "Room", cell: (r) => r.rooms?.room_number ?? "—" },
    { key: "start", header: "Start", sortValue: (r) => r.start_date, cell: (r) => formatDate(r.start_date) },
    {
      key: "end",
      header: "Ends",
      sortValue: (r) => r.end_date,
      cell: (r) => {
        const days = daysBetween(today(), r.end_date);
        return (
          <span>
            {formatDate(r.end_date)}
            {days >= 0 && days <= 60 && <span className="ml-2 text-[11px] text-primary">in {days} days</span>}
          </span>
        );
      },
    },
    { key: "rent", header: "Rent", sortValue: (r) => Number(r.monthly_rent), cell: (r) => <span className="ledger-num">{money(r.monthly_rent)}</span> },
    { key: "deposit", header: "Deposit", cell: (r) => <span className="ledger-num">{money(r.deposit)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusPill value={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {r.document_url && (
            <Button size="sm" variant="ghost" onClick={() => void openFile(r.document_url!).catch((e) => toast.error((e as Error).message))}>
              <FileText className="size-3.5" /> Document
            </Button>
          )}
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
        title="Contracts"
        subtitle="Tenancy agreements, deposits and renewal dates in one place."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="size-4" /> New contract
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Active" value={active} tone="teal" />
        <StatCard label="Ending within 60 days" value={expiring} tone="amber" />
        <StatCard label="Expired" value={expired} tone="red" />
      </div>

      <Panel className="mt-6" title="All contracts">
        <DataTable
          rows={rows}
          columns={columns}
          loading={contracts.isLoading}
          error={contracts.error ? (contracts.error as Error).message : null}
          onRetry={() => void contracts.refetch()}
          rowKey={(r) => r.id}
          searchable={(r) => `${r.tenants?.full_name ?? ""} ${r.rooms?.room_number ?? ""} ${r.status}`}
          searchPlaceholder="Search contracts…"
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
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  {["active", "expiring_soon", "expired", "terminated"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          emptyMessage="No contracts recorded yet."
          emptyAction={<Button onClick={() => openForm()}>Create a contract</Button>}
        />
      </Panel>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit contract" : "New contract"}
        onSubmit={submit}
        saving={save.isPending || uploading}
        savingLabel={uploading ? "Uploading…" : "Saving contract…"}
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tenant" className="sm:col-span-2">
            <Select
              value={form.tenant_id}
              onValueChange={(v) => {
                const a = assignments.find((x) => x.tenant_id === v);
                setForm({
                  ...form,
                  tenant_id: v,
                  monthly_rent: a ? String(a.monthly_rent) : form.monthly_rent,
                  deposit: a ? String(a.deposit) : form.deposit,
                });
              }}
            >
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
          <Field label="Start date">
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>
          <Field label="End date">
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </Field>
          <Field label="Monthly rent (TZS)">
            <Input type="number" min={1} value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} />
          </Field>
          <Field label="Deposit (TZS)">
            <Input type="number" min={0} value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["active", "expiring_soon", "expired", "terminated"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Signed contract (PDF)" hint={form.document_url ? "Document attached" : undefined}>
            <Input type="file" accept="application/pdf,image/*" onChange={(e) => void pickDocument(e.target.files?.[0])} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this contract?"
        description="The agreement and its uploaded document reference will be removed permanently."
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              void logAudit("delete", "contract", "Deleted contract", deleting.id);
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
