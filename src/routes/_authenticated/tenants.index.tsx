import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { useProperties, useRoomsList, useTenantsList } from "@/hooks/useLookups";
import { logAudit, useRows, useSave } from "@/lib/db";
import { createTenantAccount } from "@/lib/tenants.functions";
import { formatDate, formatPhone, today } from "@/lib/format";
import type { Assignment, Tenant } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/tenants/")({
  component: TenantsPage,
});

const blank = {
  full_name: "",
  phone: "",
  email: "",
  national_id: "",
  gender: "",
  date_of_birth: "",
  emergency_contact: "",
  emergency_phone: "",
  address: "",
  property_id: "",
  date_joined: today(),
  status: "active",
};

const assignBlank = {
  property_id: "",
  building_id: "",
  room_id: "",
  tenant_id: "",
  move_in_date: today(),
  monthly_rent: "",
  deposit: "",
  start_meter_electricity: "",
  start_meter_water: "",
};

function TenantsPage() {
  const navigate = useNavigate();
  const { data: tenants, isLoading, error, refetch } = useTenantsList();
  const { data: properties = [] } = useProperties();
  const { data: rooms = [] } = useRoomsList();
  const { data: assignments = [] } = useRows<Assignment>("tenant_assignments", {
    select: "*, rooms(room_number, buildings(name))",
    filters: [{ col: "is_active", value: true }],
  });

  const saveTenant = useSave("tenants", "Tenant");
  const saveAssignment = useSave("tenant_assignments", "Room assignment");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [archiving, setArchiving] = useState<Tenant | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assign, setAssign] = useState({ ...assignBlank });
  const [loginTenant, setLoginTenant] = useState<Tenant | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginSaving, setLoginSaving] = useState(false);

  function openLogin(tenant: Tenant) {
    setLoginTenant(tenant);
    setLoginForm({ email: tenant.email ?? "", password: "" });
  }

  async function submitLogin() {
    if (!loginTenant) return;
    if (!loginForm.email.includes("@")) {
      toast.error("Enter a valid email address for the tenant.");
      return;
    }
    if (loginForm.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoginSaving(true);
    try {
      await createTenantAccount({ data: { tenantId: loginTenant.id, email: loginForm.email.trim(), password: loginForm.password } });
      toast.success(`Login created for ${loginTenant.full_name}. Share the email and password with them.`);
      setLoginTenant(null);
      void logAudit("create", "tenant_account", `Created portal login for ${loginTenant.full_name}`, loginTenant.id);
      void refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the login.");
    } finally {
      setLoginSaving(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ ...blank, property_id: properties[0]?.id ?? "" });
    setOpen(true);
  }

  function openEdit(row: Tenant) {
    setEditing(row);
    setForm({
      full_name: row.full_name,
      phone: row.phone ?? "",
      email: row.email ?? "",
      national_id: row.national_id ?? "",
      gender: row.gender ?? "",
      date_of_birth: row.date_of_birth ?? "",
      emergency_contact: row.emergency_contact ?? "",
      emergency_phone: row.emergency_phone ?? "",
      address: row.address ?? "",
      property_id: row.property_id ?? "",
      date_joined: row.date_joined,
      status: row.status,
    });
    setOpen(true);
  }

  function submit() {
    if (!form.full_name.trim()) {
      toast.error("Enter the tenant's full name.");
      return;
    }
    if (form.email && !form.email.includes("@")) {
      toast.error("That email address doesn't look right.");
      return;
    }
    const payload: Record<string, unknown> = {
      ...form,
      property_id: form.property_id || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      id: editing?.id,
    };
    saveTenant.mutate(payload, {
      onSuccess: (row) => {
        setOpen(false);
        void logAudit(editing ? "update" : "create", "tenant", `Tenant ${form.full_name}`, (row as Tenant | null)?.id);
      },
    });
  }

  function openAssign(tenant: Tenant) {
    setAssign({ ...assignBlank, tenant_id: tenant.id, property_id: tenant.property_id ?? properties[0]?.id ?? "" });
    setAssignOpen(true);
  }

  function submitAssign() {
    const room = rooms.find((r) => r.id === assign.room_id);
    if (!assign.tenant_id || !room) {
      toast.error("Choose a room for this tenant.");
      return;
    }
    const rent = Number(assign.monthly_rent || room.monthly_rent);
    if (!Number.isFinite(rent) || rent <= 0) {
      toast.error("Monthly rent must be greater than zero.");
      return;
    }
    saveAssignment.mutate(
      {
        tenant_id: assign.tenant_id,
        property_id: room.property_id,
        room_id: room.id,
        move_in_date: assign.move_in_date,
        monthly_rent: rent,
        deposit: Number(assign.deposit || room.deposit_amount || 0),
        start_meter_electricity: assign.start_meter_electricity || null,
        start_meter_water: assign.start_meter_water || null,
        is_active: true,
      },
      {
        onSuccess: () => {
          setAssignOpen(false);
          void logAudit("assign", "tenant_assignment", `Assigned room ${room.room_number}`, assign.tenant_id);
        },
      },
    );
  }

  const roomOf = (tenantId: string) => assignments.find((a) => a.tenant_id === tenantId);

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      header: "Tenant",
      sortValue: (r) => r.full_name,
      cell: (r) => (
        <div>
          <div className="font-medium">{r.full_name}</div>
          <div className="text-[11px] text-muted-foreground">{formatPhone(r.phone) || r.email || "No contact"}</div>
        </div>
      ),
    },
    {
      key: "room",
      header: "Room",
      cell: (r) => {
        const a = roomOf(r.id);
        return a ? `${a.rooms?.buildings?.name ?? ""} ${a.rooms?.room_number ?? ""}`.trim() : "Not assigned";
      },
    },
    { key: "nid", header: "National ID", cell: (r) => r.national_id || "—" },
    { key: "joined", header: "Joined", sortValue: (r) => r.date_joined, cell: (r) => formatDate(r.date_joined) },
    { key: "status", header: "Status", cell: (r) => <StatusPill value={r.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex flex-wrap justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => void navigate({ to: "/tenants/$tenantId", params: { tenantId: r.id } })}>
            Profile
          </Button>
          {!roomOf(r.id) && (
            <Button size="sm" variant="ghost" onClick={() => openAssign(r)}>
              Assign room
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setArchiving(r)}>
            Archive
          </Button>
        </div>
      ),
    },
  ];

  const assignRooms = rooms.filter((r) => (!assign.property_id || r.property_id === assign.property_id) && r.status !== "occupied");

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle="Everyone renting from you, their room and their contact details."
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" /> Add tenant
          </Button>
        }
      />

      <Panel>
        <DataTable
          rows={tenants}
          columns={columns}
          loading={isLoading}
          error={error ? (error as Error).message : null}
          onRetry={() => void refetch()}
          rowKey={(r) => r.id}
          searchable={(r) => `${r.full_name} ${r.phone ?? ""} ${r.email ?? ""} ${r.national_id ?? ""}`}
          searchPlaceholder="Search tenants by name, phone or ID…"
          emptyMessage="No tenants yet."
          emptyAction={<Button onClick={openNew}>Add your first tenant</Button>}
          onRowClick={(r) => void navigate({ to: "/tenants/$tenantId", params: { tenantId: r.id } })}
        />
      </Panel>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit tenant" : "Add tenant"}
        onSubmit={submit}
        saving={saveTenant.isPending}
        savingLabel="Saving tenant…"
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Michael" />
          </Field>
          <Field label="Phone" hint="+255 7XX XXX XXX">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+255 712 345 678" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="National ID">
            <Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          </Field>
          <Field label="Date joined">
            <Input type="date" value={form.date_joined} onChange={(e) => setForm({ ...form, date_joined: e.target.value })} />
          </Field>
          <Field label="Emergency contact">
            <Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
          </Field>
          <Field label="Emergency phone">
            <Input value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} />
          </Field>
          <Field label="Property">
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
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="moved_out">Moved out</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Home address" className="sm:col-span-2">
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
          </Field>
        </div>
      </FormDialog>

      <FormDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        title="Assign a room"
        description="The room switches to Occupied automatically. A tenant can hold one active room at a time."
        onSubmit={submitAssign}
        saving={saveAssignment.isPending}
        savingLabel="Assigning room…"
        submitLabel="Assign room"
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property">
            <Select value={assign.property_id} onValueChange={(v) => setAssign({ ...assign, property_id: v, room_id: "" })}>
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
          <Field label="Room" hint="Only rooms that aren't occupied are listed.">
            <Select
              value={assign.room_id}
              onValueChange={(v) => {
                const room = rooms.find((r) => r.id === v);
                setAssign({
                  ...assign,
                  room_id: v,
                  monthly_rent: room ? String(room.monthly_rent) : assign.monthly_rent,
                  deposit: room ? String(room.deposit_amount) : assign.deposit,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose room" />
              </SelectTrigger>
              <SelectContent>
                {assignRooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.buildings?.name} · {r.room_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Move-in date">
            <Input type="date" value={assign.move_in_date} onChange={(e) => setAssign({ ...assign, move_in_date: e.target.value })} />
          </Field>
          <Field label="Monthly rent (TZS)">
            <Input type="number" min={0} value={assign.monthly_rent} onChange={(e) => setAssign({ ...assign, monthly_rent: e.target.value })} />
          </Field>
          <Field label="Deposit (TZS)">
            <Input type="number" min={0} value={assign.deposit} onChange={(e) => setAssign({ ...assign, deposit: e.target.value })} />
          </Field>
          <Field label="Starting electricity reading">
            <Input value={assign.start_meter_electricity} onChange={(e) => setAssign({ ...assign, start_meter_electricity: e.target.value })} />
          </Field>
          <Field label="Starting water reading">
            <Input value={assign.start_meter_water} onChange={(e) => setAssign({ ...assign, start_meter_water: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Archive this tenant?"
        description="They disappear from the active list but all payments and history are kept."
        confirmLabel="Archive"
        onConfirm={() => {
          if (!archiving) return;
          saveTenant.mutate(
            { id: archiving.id, archived: true, status: "moved_out" },
            {
              onSuccess: () => {
                void logAudit("archive", "tenant", `Archived ${archiving.full_name}`, archiving.id);
                setArchiving(null);
              },
            },
          );
        }}
      />
    </>
  );
}
