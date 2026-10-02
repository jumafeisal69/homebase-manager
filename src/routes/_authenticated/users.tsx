import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/app/Primitives";
import { useCurrentUser } from "@/hooks/useSession";
import { useRows } from "@/lib/db";
import { formatPhone } from "@/lib/format";
import type { Tenant } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users — NyumbaPro" },
      { name: "description", content: "See who has access to your NyumbaPro account and tenant portal." },
      { property: "og:title", content: "Users — NyumbaPro" },
      { property: "og:description", content: "See who has access to your NyumbaPro account and tenant portal." },
    ],
  }),
  component: UsersPage,
});

interface ManagerRow {
  id: string;
  user_id: string;
  can_edit: boolean;
  properties?: { name: string } | null;
}

function UsersPage() {
  const { data: me } = useCurrentUser();
  const { data: managers = [] } = useRows<ManagerRow>("property_managers", { select: "*, properties(name)" });
  const { data: tenants = [] } = useRows<Tenant>("tenants", { filters: [{ col: "archived", value: false }], order: { col: "full_name", asc: true } });

  return (
    <>
      <PageHeader title="Users & access" subtitle="Who can sign in to your properties." />

      <Panel title="Owner">
        <div className="flex items-center justify-between gap-3 px-5 py-4 text-[13px]">
          <div>
            <div className="font-medium">{me?.fullName}</div>
            <div className="text-[11px] text-muted-foreground">{me?.email}</div>
          </div>
          <StatusPill value="active" />
        </div>
      </Panel>

      <Panel title="Property managers" className="mt-4">
        {managers.length === 0 ? (
          <EmptyState message="No property managers yet. Inviting managers by email is coming soon." />
        ) : (
          <ul className="divide-y divide-border text-[13px]">
            {managers.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-5 py-3">
                <span>{m.properties?.name}</span>
                <span className="text-muted-foreground">{m.can_edit ? "Can edit" : "View only"}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Tenant portal access" className="mt-4">
        <p className="border-b border-border px-5 py-3 text-[12px] text-muted-foreground">
          A tenant gets portal access when they create an account with the same email you saved on their profile.
        </p>
        {tenants.length === 0 ? (
          <EmptyState message="No tenants yet." />
        ) : (
          <ul className="divide-y divide-border text-[13px]">
            {tenants.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <div className="font-medium">{t.full_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.email || "No email"} · {formatPhone(t.phone)}
                  </div>
                </div>
                <span className={t.user_id ? "text-[12px] text-success" : "text-[12px] text-muted-foreground"}>
                  {t.user_id ? "Portal active" : "Not signed up yet"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
