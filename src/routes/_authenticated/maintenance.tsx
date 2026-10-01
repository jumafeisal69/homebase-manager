import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog, FormDialog } from "@/components/app/FormDialog";
import { Field, PageHeader, Panel, StatCard, StatusPill } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProperties, useRoomsList } from "@/hooks/useLookups";
import { logAudit, notify, useRemove, useRows, useSave } from "@/lib/db";
import { formatDate, money, today } from "@/lib/format";
import type { Assignment, MaintenanceRequest } from "@/lib/types";
import { openFile, uploadFile } from "@/lib/upload";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — NyumbaPro" },
      { name: "description", content: "Track repair requests from submission to completion, with technicians and costs." },
      { property: "og:title", content: "Maintenance — NyumbaPro" },
      { property: "og:description", content: "Track repair requests from submission to completion, with technicians and costs." },
    ],
  }),
  component: MaintenancePage,
});

const CATEGORIES = ["electricity", "water", "plumbing", "door", "window", "internet", "security", "other"];
const STATUSES = ["submitted", "accepted", "in_progress", "completed", "rejected"];

function MaintenancePage() {
  const { data: properties = [] } = useProperties();
  const { data: rooms = [] } = useRoomsList();
  const { data: assignments = [] } = useRows<Assignment>("tenant_assignments", {
    select: "*, tenants(full_name, user_id)",
    filters: [{ col: "is_active", value: true }],
  });

  const [fProperty, setFProperty] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const jobs = useRows<MaintenanceRequest>("maintenance_requests", {
    select: "*, tenants(full_name), rooms(room_number)",
    filters: [{ col: "property_id", value: fProperty }],
    order: { col: "created_at", asc: false },
  });

  const save = useSave("maintenance_requests", "Maintenance request");
  const remove = useRemove("maintenance_requests", "Maintenance request");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRequest | null>(null);
  const blank = {
    room_id: "",
    category: "plumbing",
    priority: "medium",
    description: "",
    status: "submitted",
    technician: "",
    admin_notes: "",
    cost: "0",
    completed_at: "",
    photo_url: "",
    receipt_url: "",
  };
  const [form, setForm] = useState(blank);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<MaintenanceRequest | null>(null);

  const rows = (jobs.data ?? []).filter((j) => fStatus === "all" || j.status === fStatus);
  const openCount = rows.filter((j) => j.status !== "completed" && j.status !== "rejected").length;
  const urgent = rows.filter((j) => j.priority === "urgent" || j.priority === "high").length;
  const spend = rows.reduce((s, j) => s + Number(j.cost), 0);

  function openForm(row?: MaintenanceRequest) {
    setEditing(row ?? null);
    setForm(
      row
        ? {
            room_id: row.room_id ?? "",
            category: row.category,
            priority: row.priority,
            description: row.description,
            status: row.status,
            technician: row.technician ?? "",
            admin_notes: row.admin_notes ?? "",
            cost: String(row.cost),
            completed_at: row.completed_at ?? "",
            photo_url: row.photo_url ?? "",
            receipt_url: (row as MaintenanceRequest & { receipt_url?: string | null }).receipt_url ?? "",
          }
        : blank,
    );
    setOpen(true);
  }

  async function pickFile(field: "photo_url" | "receipt_url", file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file, "maintenance");
      setForm((f) => ({ ...f, [field]: path }));
      toast.success("File uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    const room = rooms.find((r) => r.id === form.room_id);
    if (!room) {
      toast.error("Choose a room.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Describe the problem.");
      return;
    }
    const assignment = assignments.find((a) => a.room_id === room.id);
    save.mutate(
      {
        id: editing?.id,
        property_id: room.property_id,
        room_id: room.id,
        tenant_id: editing?.tenant_id ?? assignment?.tenant_id ?? null,
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
        status: form.status,
        technician: form.technician || null,
        admin_notes: form.admin_notes || null,
        cost: Number(form.cost || 0),
        completed_at: form.status === "completed" ? form.completed_at || today() : null,
        photo_url: form.photo_url || null,
        receipt_url: form.receipt_url || null,
      },
      {
        onSuccess: (saved) => {
          setOpen(false);
          const row = saved as MaintenanceRequest | null;
          void logAudit(editing ? "update" : "create", "maintenance", `Maintenance ${form.category} — ${form.status.replace("_", " ")}`, row?.id);
          const tenantUser = (assignment?.tenants as { user_id?: string | null } | null | undefined)?.user_id;
          if (editing && tenantUser) {
            void notify(tenantUser, "Maintenance update", `Your ${form.category} request is now ${form.status.replace("_", " ")}.`, "maintenance");
          }
        },
      },
    );
  }

  const columns: Column<MaintenanceRequest>[] = [
    { key: "desc", header: "Request", sortValue: (r) => r.description, cell: (r) => <span className="font-medium">{r.description}</span> },
    { key: "room", header: "Room", cell: (r) => r.rooms?.room_number ?? "—" },
    { key: "tenant", header: "Tenant", cell: (r) => r.tenants?.full_name ?? "—" },
    { key: "category", header: "Category", cell: (r) => r.category },
    { key: "priority", header: "Priority", cell: (r) => <StatusPill value={r.priority} /> },
    { key: "status", header: "Status", cell: (r) => <StatusPill value={r.status} /> },
    { key: "tech", header: "Technician", cell: (r) => r.technician || "—" },
    { key: "cost", header: "Cost", sortValue: (r) => Number(r.cost), cell: (r) => <span className="ledger-num">{money(r.cost)}</span> },
    { key: "date", header: "Submitted", sortValue: (r) => r.created_at, cell: (r) => formatDate(r.created_at) },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {r.photo_url && (
            <Button size="sm" variant="ghost" onClick={() => void openFile(r.photo_url!).catch((e) => toast.error((e as Error).message))}>
              <Paperclip className="size-3.5" /> Photo
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openForm(r)}>
            Manage
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
        title="Maintenance"
        subtitle="Repairs reported by tenants and jobs you log yourself."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="size-4" /> Log a job
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Open jobs" value={openCount} tone="sky" />
        <StatCard label="High or urgent" value={urgent} tone="red" />
        <StatCard label="Repair spend" value={money(spend)} tone="amber" />
      </div>

      <Panel className="mt-6" title="All requests">
        <DataTable
          rows={rows}
          columns={columns}
          loading={jobs.isLoading}
          error={jobs.error ? (jobs.error as Error).message : null}
          onRetry={() => void jobs.refetch()}
          rowKey={(r) => r.id}
          searchable={(r) => `${r.description} ${r.category} ${r.technician ?? ""} ${r.rooms?.room_number ?? ""} ${r.tenants?.full_name ?? ""}`}
          searchPlaceholder="Search requests…"
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
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          emptyMessage="No maintenance requests yet."
          emptyAction={<Button onClick={() => openForm()}>Log a job</Button>}
        />
      </Panel>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Manage request" : "Log a maintenance job"}
        onSubmit={submit}
        saving={save.isPending || uploading}
        savingLabel={uploading ? "Uploading…" : "Saving request…"}
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Room" className="sm:col-span-2">
            <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
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
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Technician">
            <Input value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} />
          </Field>
          <Field label="Cost (TZS)">
            <Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </Field>
          <Field label="Completion date">
            <Input type="date" value={form.completed_at} onChange={(e) => setForm({ ...form, completed_at: e.target.value })} />
          </Field>
          <Field label="Photo" hint={form.photo_url ? "Photo attached" : undefined}>
            <Input type="file" accept="image/*" onChange={(e) => void pickFile("photo_url", e.target.files?.[0])} />
          </Field>
          <Field label="Receipt" hint={form.receipt_url ? "Receipt attached" : undefined}>
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => void pickFile("receipt_url", e.target.files?.[0])} />
          </Field>
          <Field label="Internal notes" className="sm:col-span-2">
            <Textarea rows={2} value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this request?"
        description="The maintenance request and its recorded cost will be removed permanently."
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              void logAudit("delete", "maintenance", `Deleted maintenance request`, deleting.id);
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
