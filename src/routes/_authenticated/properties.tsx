import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog, FormDialog } from "@/components/app/FormDialog";
import { Field, PageHeader, Panel, StatusPill } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProperties } from "@/hooks/useLookups";
import { logAudit, useRemove, useRows, useSave } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { Building, Property } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/properties")({
  component: PropertiesPage,
});

const blank = {
  name: "",
  address: "",
  region: "",
  district: "",
  ward: "",
  street: "",
  description: "",
  status: "active",
};

function PropertiesPage() {
  const { data: properties, isLoading, error, refetch } = useProperties();
  const { data: buildings = [] } = useRows<Building>("buildings", { select: "id, property_id" });
  const save = useSave("properties", "Property");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [archiving, setArchiving] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);
  const remove = useRemove("properties", "Property");

  function openNew() {
    setEditing(null);
    setForm({ ...blank });
    setOpen(true);
  }

  function openEdit(row: Property) {
    setEditing(row);
    setForm({
      name: row.name,
      address: row.address ?? "",
      region: row.region ?? "",
      district: row.district ?? "",
      ward: row.ward ?? "",
      street: row.street ?? "",
      description: row.description ?? "",
      status: row.status,
    });
    setOpen(true);
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("Give the property a name.");
      return;
    }
    save.mutate(
      { ...form, id: editing?.id },
      {
        onSuccess: (row) => {
          setOpen(false);
          void logAudit(editing ? "update" : "create", "property", `Property "${form.name}"`, (row as Property | null)?.id);
        },
      },
    );
  }

  const columns: Column<Property>[] = [
    {
      key: "name",
      header: "Property",
      sortValue: (r) => r.name,
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-[11px] text-muted-foreground">{r.address || "No address"}</div>
        </div>
      ),
    },
    { key: "region", header: "Region", cell: (r) => r.region || "—", sortValue: (r) => r.region ?? "" },
    { key: "district", header: "District / ward", cell: (r) => [r.district, r.ward].filter(Boolean).join(" · ") || "—" },
    {
      key: "buildings",
      header: "Buildings",
      cell: (r) => buildings.filter((b) => b.property_id === r.id).length,
    },
    { key: "status", header: "Status", cell: (r) => <StatusPill value={r.status} /> },
    { key: "created", header: "Added", cell: (r) => formatDate(r.created_at) },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setArchiving(r)}>
            Archive
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(r)}>
            Delete
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <>
      <PageHeader
        title="Properties"
        subtitle="Every plot or compound you manage. Buildings and rooms live inside a property."
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" /> Add property
          </Button>
        }
      />

      <Panel>
        <DataTable
          rows={properties}
          columns={columns}
          loading={isLoading}
          error={error ? (error as Error).message : null}
          onRetry={() => void refetch()}
          rowKey={(r) => r.id}
          searchable={(r) => `${r.name} ${r.region ?? ""} ${r.district ?? ""} ${r.address ?? ""}`}
          searchPlaceholder="Search properties…"
          emptyMessage="No properties yet."
          emptyAction={<Button onClick={openNew}>Add your first property</Button>}
        />
      </Panel>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit property" : "Add property"}
        description="Give the property a clear name and location so you can find it fast."
        onSubmit={submit}
        saving={save.isPending}
        savingLabel="Saving property…"
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sinza Apartments" />
          </Field>
          <Field label="Region">
            <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Dar es Salaam" />
          </Field>
          <Field label="District">
            <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Ubungo" />
          </Field>
          <Field label="Ward">
            <Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} placeholder="Sinza" />
          </Field>
          <Field label="Street">
            <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Shekilango" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Archive this property?"
        description="It will be hidden from lists, but all rent, utility and maintenance history stays intact."
        confirmLabel="Archive"
        onConfirm={() => {
          if (!archiving) return;
          save.mutate(
            { id: archiving.id, archived: true },
            {
              onSuccess: () => {
                void logAudit("archive", "property", `Archived "${archiving.name}"`, archiving.id);
                setArchiving(null);
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this property permanently?"
        description={`"${deleting?.name ?? ""}" and all its buildings, rooms, tenant assignments, rent, utility and maintenance records will be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return;
          const target = deleting;
          remove.mutate(target.id, {
            onSuccess: () => {
              void logAudit("delete", "property", `Deleted "${target.name}"`, target.id);
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
