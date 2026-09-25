import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Field } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/useSession";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { friendly } from "@/lib/db";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — NyumbaPro" },
      { name: "description", content: "Sign in or create your NyumbaPro landlord account." },
      { property: "og:title", content: "Sign in — NyumbaPro" },
      { property: "og:description", content: "Access your NyumbaPro property dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: me } = useCurrentUser();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!me) return;
    void navigate({ to: me.role === "tenant" ? "/portal" : "/dashboard", replace: true });
  }, [me, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || password.length < 6) {
      toast.error("Enter your email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(friendly((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in didn't complete. Please try again.");
  }

  if (checkEmail) {
    return (
      <Centered>
        <h1 className="font-display text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          We sent a confirmation link to <span className="text-foreground">{email}</span>. Open it to activate your
          account, then come back and sign in.
        </p>
        <Button className="mt-6 w-full" variant="outline" onClick={() => setCheckEmail(false)}>
          Back to sign in
        </Button>
      </Centered>
    );
  }

  return (
    <Centered>
      <h1 className="font-display text-xl font-semibold">
        {mode === "signin" ? "Sign in to NyumbaPro" : "Create your landlord account"}
      </h1>
      <p className="mt-1.5 text-[13px] text-muted-foreground">
        {mode === "signin" ? "Welcome back. Your ledger is waiting." : "Start managing your properties in minutes."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juma Salehe" />
          </Field>
        )}
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="w-full" onClick={() => void google()}>
        Continue with Google
      </Button>

      <div className="mt-6 flex flex-wrap justify-between gap-2 text-[12px] text-muted-foreground">
        <button
          type="button"
          className="transition-colors hover:text-foreground"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Need an account? Register" : "Already registered? Sign in"}
        </button>
        <Link to="/forgot-password" className="transition-colors hover:text-foreground">
          Forgot password?
        </Link>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="skew-wash bg-gradient-to-r from-primary/20 to-transparent" />
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-7 ring-1 ring-border">
        <Link to="/" className="mb-6 flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
            N
          </div>
          <span className="font-display text-[15px] font-semibold">NyumbaPro</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
