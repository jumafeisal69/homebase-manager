import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FormDialog } from "@/components/app/FormDialog";
import { EmptyState, Field, PageHeader, Panel, StatusPill } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useSession";
import { useRows, useSave } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { Assignment, MaintenanceRequest } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/portal/maintenance")({
  head: () => ({
    meta: [
      { title: "My maintenance requests — NyumbaPro" },
      { name: "description", content: "Report problems in your room and follow their progress." },
      { property: "og:title", content: "My maintenance requests — NyumbaPro" },
      { property: "og:description", content: "Report problems in your room and follow their progress." },
    ],
  }),
  component: PortalMaintenance,
});

function PortalMaintenance() {
  const { data: me } = useCurrentUser();
  const tid = me?.tenantId;
  const f = [{ col: "tenant_id", value: tid }];
  const enabled = Boolean(tid);
  const { data: jobs = [] } = useRows<MaintenanceRequest>("maintenance_requests", { filters: f, order: { col: "created_at", asc: false }, enabled });
  const { data: assignments = [] } = useRows<Assignment>("tenant_assignments", { filters: [...f, { col: "is_active", value: true }], enabled });
  const save = useSave("maintenance_requests", "Request");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "plumbing", priority: "medium", description: "" });

  function submit() {
    const a = assignments[0];
    if (!a) return void toast.error("You don't have an active room yet.");
    if (!form.description.trim()) return void toast.error("Describe the problem.");
    save.mutate(
      { owner_id: a.owner_id, property_id: a.property_id, room_id: a.room_id, tenant_id: tid, ...form, description: form.description.trim() },
      { onSuccess: () => { setOpen(false); setForm({ category: "plumbing", priority: "medium", description: "" }); } },
    );
  }

  return (
    <>
      <PageHeader title="Maintenance" actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Report a problem</Button>} />
      <Panel>
        {jobs.length === 0 ? <EmptyState message="No maintenance requests." /> : (
          <ul className="divide-y divide-border text-[13px]">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0"><div className="truncate font-medium">{j.description}</div><div className="text-[11px] text-muted-foreground">{j.category} · {formatDate(j.created_at)}</div></div>
                <StatusPill value={j.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <FormDialog open={open} onOpenChange={setOpen} title="Report a problem" onSubmit={submit} saving={save.isPending} savingLabel="Sending…" submitLabel="Send">
        <Field label="Category">
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["electricity", "water", "plumbing", "door", "window", "internet", "security", "other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["low", "medium", "high", "urgent"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </FormDialog>
    </>
  );
}
