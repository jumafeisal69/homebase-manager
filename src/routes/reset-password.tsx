import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Field } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { friendly } from "@/lib/db";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — NyumbaPro" },
      { name: "description", content: "Set a new password for your NyumbaPro account." },
      { property: "og:title", content: "Choose a new password — NyumbaPro" },
      { property: "og:description", content: "Set a new password for your NyumbaPro account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 6) {
      toast.error("Use at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      void navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(friendly((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="skew-wash bg-gradient-to-r from-primary/20 to-transparent" />
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-7 ring-1 ring-border">
        <h1 className="font-display text-xl font-semibold">Choose a new password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="New password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirm password">
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
