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
import { useBuildings, useProperties } from "@/hooks/useLookups";
import { logAudit, useRemove, useRows, useSave } from "@/lib/db";
import type { Building, Room } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/buildings")({
  component: BuildingsPage,
});

const blank = { property_id: "", name: "", building_number: "", floors: "1", description: "", status: "active" };

function BuildingsPage() {
  const { data: properties = [] } = useProperties();
  const [filterProperty, setFilterProperty] = useState("all");
  const { data: buildings, isLoading, error, refetch } = useBuildings(filterProperty === "all" ? undefined : filterProperty);
  const { data: rooms = [] } = useRows<Room>("rooms", { select: "id, building_id" });
  const save = useSave("buildings", "Building");
  const remove = useRemove("buildings", "Building");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [deleting, setDeleting] = useState<Building | null>(null);

  function openNew() {
    setEditing(null);
    setForm({ ...blank, property_id: properties[0]?.id ?? "" });
    setOpen(true);
  }

  function openEdit(row: Building) {
    setEditing(row);
    setForm({
      property_id: row.property_id,
      name: row.name,
      building_number: row.building_number ?? "",
      floors: String(row.floors),
      description: row.description ?? "",
      status: row.status,
    });
    setOpen(true);
  }

  function submit() {
    if (!form.property_id) {
      toast.error("Choose the property this building belongs to.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Give the building a name, e.g. Block A.");
      return;
    }
    const floors = Number(form.floors);
    if (!Number.isFinite(floors) || floors < 1) {
      toast.error("Floors must be at least 1.");
      return;
    }
    save.mutate(
      { ...form, floors, id: editing?.id },
      {
        onSuccess: (row) => {
          setOpen(false);
          void logAudit(editing ? "update" : "create", "building", `Building "${form.name}"`, (row as Building | null)?.id);
        },
      },
    );
  }

  const columns: Column<Building>[] = [
    {
      key: "name",
      header: "Building",
      sortValue: (r) => r.name,
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-[11px] text-muted-foreground">{r.building_number || "No number"}</div>
        </div>
      ),
    },
    { key: "property", header: "Property", cell: (r) => r.properties?.name ?? "—" },
    { key: "floors", header: "Floors", cell: (r) => r.floors, sortValue: (r) => r.floors },
    { key: "rooms", header: "Rooms", cell: (r) => rooms.filter((x) => x.building_id === r.id).length },
    { key: "status", header: "Status", cell: (r) => <StatusPill value={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
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
        title="Buildings"
        subtitle="Blocks or houses inside a property. Rooms belong to a building."
        actions={
          <>
            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger className="w-[180px]">
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
            <Button onClick={openNew} disabled={properties.length === 0}>
              <Plus className="size-4" /> Add building
            </Button>
          </>
        }
      />

      <Panel>
        <DataTable
          rows={buildings}
          columns={columns}
          loading={isLoading}
          error={error ? (error as Error).message : null}
          onRetry={() => void refetch()}
          rowKey={(r) => r.id}
          searchable={(r) => `${r.name} ${r.building_number ?? ""} ${r.properties?.name ?? ""}`}
          searchPlaceholder="Search buildings…"
          emptyMessage={properties.length === 0 ? "Add a property first, then its buildings." : "No buildings yet."}
          emptyAction={properties.length > 0 ? <Button onClick={openNew}>Add a building</Button> : undefined}
        />
      </Panel>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit building" : "Add building"}
        onSubmit={submit}
        saving={save.isPending}
        savingLabel="Saving building…"
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property" className="sm:col-span-2">
            <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Block A" />
          </Field>
          <Field label="Building number">
            <Input value={form.building_number} onChange={(e) => setForm({ ...form, building_number: e.target.value })} placeholder="A" />
          </Field>
          <Field label="Floors">
            <Input type="number" min={1} value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} />
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
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this building?"
        description="Rooms inside it will be removed too. This cannot be undone."
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              void logAudit("delete", "building", `Deleted "${deleting.name}"`, deleting.id);
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
