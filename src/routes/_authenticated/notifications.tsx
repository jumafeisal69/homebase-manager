import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, LoadingRows, PageHeader, Panel } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useSession";
import { db, friendly, useRows } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — NyumbaPro" },
      { name: "description", content: "Rent, maintenance and contract updates in one inbox." },
      { property: "og:title", content: "Notifications — NyumbaPro" },
      { property: "og:description", content: "Rent, maintenance and contract updates in one inbox." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const { data = [], isLoading } = useRows<AppNotification>("notifications", {
    filters: [{ col: "user_id", value: me?.id }],
    order: { col: "created_at", asc: false },
    enabled: Boolean(me?.id),
  });

  async function markRead(ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await db.from("notifications").update({ is_read: true }).in("id", ids);
    if (error) toast.error(friendly(error.message));
    else void qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  const unread = data.filter((n) => !n.is_read).map((n) => n.id);

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread.length ? `${unread.length} unread` : "You're all caught up."}
        actions={
          <Button variant="outline" disabled={unread.length === 0} onClick={() => void markRead(unread)}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        }
      />
      <Panel>
        {isLoading ? (
          <LoadingRows />
        ) : data.length === 0 ? (
          <EmptyState message="No notifications yet. Payment, maintenance and contract updates will appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {data.map((n) => (
              <li
                key={n.id}
                className={cn("flex cursor-pointer items-start gap-3 px-5 py-4", !n.is_read && "bg-primary/5")}
                onClick={() => !n.is_read && void markRead([n.id])}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.is_read ? "bg-border" : "bg-primary")} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{n.title}</div>
                  {n.body && <div className="mt-0.5 text-[12px] text-muted-foreground">{n.body}</div>}
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(n.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
