import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Field } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { friendly } from "@/lib/db";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — NyumbaPro" },
      { name: "description", content: "Request a password reset link for your NyumbaPro account." },
      { property: "og:title", content: "Reset your password — NyumbaPro" },
      { property: "og:description", content: "Request a password reset link for your NyumbaPro account." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      toast.error("Enter the email you registered with.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
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
        <h1 className="font-display text-xl font-semibold">Forgot your password?</h1>
        {sent ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            If an account exists for {email}, a reset link is on its way. Open it to choose a new password.
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Enter your email and we'll send you a link to set a new one.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </>
        )}
        <Link to="/auth" className="mt-6 block text-[12px] text-muted-foreground transition-colors hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
