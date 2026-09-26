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
import { useBuildings, useProperties, useRoomsList } from "@/hooks/useLookups";
import { logAudit, useRemove, useSave } from "@/lib/db";
import { money } from "@/lib/format";
import type { Room } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/rooms")({
  component: RoomsPage,
});

const blank = {
  property_id: "",
  building_id: "",
  room_number: "",
  floor: "0",
  room_type: "single",
  monthly_rent: "",
  deposit_amount: "",
  electricity_meter: "",
  water_meter: "",
  status: "vacant",
};

function RoomsPage() {
  const { data: properties = [] } = useProperties();
  const [fProperty, setFProperty] = useState("all");
  const [fBuilding, setFBuilding] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const { data: allBuildings = [] } = useBuildings();
  const { data: rooms, isLoading, error, refetch } = useRoomsList({
    propertyId: fProperty === "all" ? undefined : fProperty,
    buildingId: fBuilding === "all" ? undefined : fBuilding,
  });
  const save = useSave("rooms", "Room");
  const remove = useRemove("rooms", "Room");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [deleting, setDeleting] = useState<Room | null>(null);

  const visible = (rooms ?? []).filter((r) => fStatus === "all" || r.status === fStatus);
  const formBuildings = allBuildings.filter((b) => !form.property_id || b.property_id === form.property_id);

  function openNew() {
    setEditing(null);
    const property = fProperty !== "all" ? fProperty : (properties[0]?.id ?? "");
    setForm({ ...blank, property_id: property, building_id: allBuildings.find((b) => b.property_id === property)?.id ?? "" });
    setOpen(true);
  }

  function openEdit(row: Room) {
    setEditing(row);
    setForm({
      property_id: row.property_id,
      building_id: row.building_id,
      room_number: row.room_number,
      floor: String(row.floor),
      room_type: row.room_type ?? "single",
      monthly_rent: String(row.monthly_rent),
      deposit_amount: String(row.deposit_amount),
      electricity_meter: row.electricity_meter ?? "",
      water_meter: row.water_meter ?? "",
      status: row.status,
    });
    setOpen(true);
  }

  function submit() {
    if (!form.property_id || !form.building_id) {
      toast.error("Choose the property and building.");
      return;
    }
    if (!form.room_number.trim()) {
      toast.error("Enter the room number.");
      return;
    }
    const rent = Number(form.monthly_rent);
    const deposit = Number(form.deposit_amount || 0);
    if (!Number.isFinite(rent) || rent < 0) {
      toast.error("Monthly rent must be a positive amount.");
      return;
    }
    save.mutate(
      {
        ...form,
        floor: Number(form.floor || 0),
        monthly_rent: rent,
        deposit_amount: deposit,
        id: editing?.id,
      },
      {
        onSuccess: (row) => {
          setOpen(false);
          void logAudit(editing ? "update" : "create", "room", `Room ${form.room_number}`, (row as Room | null)?.id);
        },
      },
    );
  }

  const columns: Column<Room>[] = [
    {
      key: "room",
      header: "Room",
      sortValue: (r) => r.room_number,
      cell: (r) => (
        <div>
          <div className="font-medium">{r.room_number}</div>
          <div className="text-[11px] text-muted-foreground">
            {r.buildings?.name ?? "—"} · Floor {r.floor}
          </div>
        </div>
      ),
    },
    { key: "property", header: "Property", cell: (r) => r.properties?.name ?? "—" },
    { key: "type", header: "Type", cell: (r) => r.room_type ?? "—" },
    { key: "rent", header: "Monthly rent", sortValue: (r) => Number(r.monthly_rent), cell: (r) => <span className="ledger-num">{money(r.monthly_rent)}</span> },
    { key: "deposit", header: "Deposit", cell: (r) => <span className="ledger-num">{money(r.deposit_amount)}</span> },
    {
      key: "meters",
      header: "Meters",
      cell: (r) => (
        <div className="text-[11px] text-muted-foreground">
          <div>LUKU: {r.electricity_meter || "—"}</div>
          <div>Water: {r.water_meter || "—"}</div>
        </div>
      ),
    },
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
        title="Rooms"
        subtitle="Every rentable room, its rent, deposit and meter numbers."
        actions={
          <Button onClick={openNew} disabled={allBuildings.length === 0}>
            <Plus className="size-4" /> Add room
          </Button>
        }
      />

      <Panel>
        <DataTable
          rows={visible}
          columns={columns}
          loading={isLoading}
          error={error ? (error as Error).message : null}
          onRetry={() => void refetch()}
          rowKey={(r) => r.id}
          searchable={(r) => `${r.room_number} ${r.electricity_meter ?? ""} ${r.water_meter ?? ""} ${r.buildings?.name ?? ""}`}
          searchPlaceholder="Search rooms or meter numbers…"
          emptyMessage={allBuildings.length === 0 ? "Add a building first, then its rooms." : "No rooms match these filters."}
          toolbar={
            <div className="flex flex-wrap gap-2">
              <Select
                value={fProperty}
                onValueChange={(v) => {
                  setFProperty(v);
                  setFBuilding("all");
                }}
              >
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
              <Select value={fBuilding} onValueChange={setFBuilding}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All buildings</SelectItem>
                  {allBuildings
                    .filter((b) => fProperty === "all" || b.property_id === fProperty)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </Panel>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit room" : "Add room"}
        onSubmit={submit}
        saving={save.isPending}
        savingLabel="Saving room…"
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property">
            <Select
              value={form.property_id}
              onValueChange={(v) => setForm({ ...form, property_id: v, building_id: "" })}
            >
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
          <Field label="Building">
            <Select value={form.building_id} onValueChange={(v) => setForm({ ...form, building_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose building" />
              </SelectTrigger>
              <SelectContent>
                {formBuildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Room number">
            <Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} placeholder="A-01" />
          </Field>
          <Field label="Floor">
            <Input type="number" min={0} value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
          </Field>
          <Field label="Room type">
            <Select value={form.room_type} onValueChange={(v) => setForm({ ...form, room_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single room</SelectItem>
                <SelectItem value="self contained">Self contained</SelectItem>
                <SelectItem value="1 bedroom">1 bedroom</SelectItem>
                <SelectItem value="2 bedroom">2 bedroom</SelectItem>
                <SelectItem value="3 bedroom">3 bedroom</SelectItem>
                <SelectItem value="shop">Shop</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Monthly rent (TZS)">
            <Input type="number" min={0} value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} placeholder="250000" />
          </Field>
          <Field label="Deposit (TZS)">
            <Input type="number" min={0} value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} placeholder="250000" />
          </Field>
          <Field label="Electricity meter (LUKU)">
            <Input value={form.electricity_meter} onChange={(e) => setForm({ ...form, electricity_meter: e.target.value })} />
          </Field>
          <Field label="Water meter">
            <Input value={form.water_meter} onChange={(e) => setForm({ ...form, water_meter: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this room?"
        description="Rent, utility and maintenance records linked to it will lose their room reference. This cannot be undone."
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              void logAudit("delete", "room", `Deleted room ${deleting.room_number}`, deleting.id);
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
