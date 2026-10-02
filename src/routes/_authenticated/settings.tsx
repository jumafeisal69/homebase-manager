import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Field, PageHeader, Panel } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useSession";
import { db, friendly } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NyumbaPro" },
      { name: "description", content: "Profile, rent rules, notifications and security settings." },
      { property: "og:title", content: "Settings — NyumbaPro" },
      { property: "og:description", content: "Profile, rent rules, notifications and security settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const isLandlord = me?.role !== "tenant";

  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [rules, setRules] = useState({ default_due_day: 5, grace_period_days: 5, notify_rent: true, notify_maintenance: true, notify_contracts: true });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (me) setProfile({ full_name: me.fullName, phone: me.phone ?? "" });
  }, [me]);

  useEffect(() => {
    if (!me || !isLandlord) return;
    void db
      .from("system_settings")
      .select("*")
      .eq("owner_id", me.id)
      .maybeSingle()
      .then(({ data }: { data: typeof rules | null }) => {
        if (data) setRules({ ...rules, ...data });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, isLandlord]);

  async function run(key: string, fn: () => Promise<{ error: { message: string } | null }>, ok: string) {
    setBusy(key);
    const { error } = await fn();
    setBusy(null);
    if (error) toast.error(friendly(error.message));
    else {
      toast.success(ok);
      void qc.invalidateQueries();
    }
  }

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Your profile">
          <form
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!profile.full_name.trim()) return toast.error("Enter your name.");
              void run("profile", () => db.from("profiles").update({ full_name: profile.full_name.trim(), phone: profile.phone || null }).eq("id", me!.id), "Profile saved");
            }}
          >
            <Field label="Full name">
              <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            </Field>
            <Field label="Phone" hint="Format: +255 7XX XXX XXX">
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={me?.email ?? ""} disabled />
            </Field>
            <Button type="submit" disabled={busy === "profile"}>
              {busy === "profile" && <Loader2 className="size-4 animate-spin" />} Save profile
            </Button>
          </form>
        </Panel>

        {isLandlord && (
          <Panel title="Rent rules & notifications">
            <form
              className="space-y-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (rules.default_due_day < 1 || rules.default_due_day > 28) return toast.error("Due day must be between 1 and 28.");
                void run(
                  "rules",
                  () => db.from("system_settings").upsert({ owner_id: me!.id, currency: "TZS", ...rules }, { onConflict: "owner_id" }),
                  "Settings saved",
                );
              }}
            >
              <Field label="Currency">
                <Input value="TZS — Tanzanian Shilling" disabled />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Rent due day of month">
                  <Input type="number" min={1} max={28} value={rules.default_due_day} onChange={(e) => setRules({ ...rules, default_due_day: Number(e.target.value) })} />
                </Field>
                <Field label="Grace period (days)">
                  <Input type="number" min={0} max={30} value={rules.grace_period_days} onChange={(e) => setRules({ ...rules, grace_period_days: Number(e.target.value) })} />
                </Field>
              </div>
              {(
                [
                  ["notify_rent", "Rent due and overdue alerts"],
                  ["notify_maintenance", "Maintenance updates"],
                  ["notify_contracts", "Contract expiry alerts"],
                ] as const
              ).map(([key, text]) => (
                <label key={key} className="flex items-center justify-between text-[13px]">
                  {text}
                  <Switch checked={rules[key]} onCheckedChange={(v) => setRules({ ...rules, [key]: v })} />
                </label>
              ))}
              <p className="text-[11px] text-muted-foreground">SMS and WhatsApp reminders are coming soon. Alerts currently appear in-app.</p>
              <Button type="submit" disabled={busy === "rules"}>
                {busy === "rules" && <Loader2 className="size-4 animate-spin" />} Save settings
              </Button>
            </form>
          </Panel>
        )}

        <Panel title="Security">
          <form
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (pw.next.length < 8) return toast.error("Use at least 8 characters for your new password.");
              void run(
                "pw",
                async () => {
                  const res = await supabase.auth.updateUser({ password: pw.next, current_password: pw.current } as never);
                  if (!res.error) setPw({ current: "", next: "" });
                  return { error: res.error };
                },
                "Password changed",
              );
            }}
          >
            <Field label="Current password">
              <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field label="New password">
              <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <Button type="submit" disabled={busy === "pw"}>
              {busy === "pw" && <Loader2 className="size-4 animate-spin" />} Change password
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
