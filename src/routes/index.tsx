import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Droplets, FileText, Receipt, Wrench, Zap } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NyumbaPro — Rent, utilities and tenants for Tanzanian landlords" },
      {
        name: "description",
        content:
          "Track rooms, tenants, rent balances, electricity and water purchases, maintenance and contracts in TZS — from any device.",
      },
      { property: "og:title", content: "NyumbaPro — Rent, utilities and tenants for Tanzanian landlords" },
      {
        property: "og:description",
        content: "One dashboard for properties, tenants, rent collection, utilities, maintenance and contracts.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Receipt, title: "Rent ledger", body: "Charges, part-payments and outstanding balances calculated from real transactions." },
  { icon: Zap, title: "Electricity", body: "Log every token purchase per room, with units, meter number and receipt." },
  { icon: Droplets, title: "Water", body: "Monthly water spend per room and tenant, ready for reporting." },
  { icon: Wrench, title: "Maintenance", body: "Tenants report issues; you assign a technician, cost and completion date." },
  { icon: FileText, title: "Contracts", body: "Store agreements, get warned before a lease expires." },
];

function Landing() {
  const { data: me } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!me) return;
    void navigate({ to: me.role === "tenant" ? "/portal" : "/dashboard", replace: true });
  }, [me, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
            N
          </div>
          <span className="font-display text-[15px] font-semibold">NyumbaPro</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="relative overflow-hidden">
        <div className="skew-wash bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Tanzania · TZS</p>
          <h1 className="mt-4 max-w-[18ch] text-4xl font-bold leading-[1.05] sm:text-6xl">
            Every room, every shilling, one ledger.
          </h1>
          <p className="mt-5 max-w-[56ch] text-pretty text-[15px] text-muted-foreground">
            NyumbaPro keeps your properties, tenants, rent balances, LUKU purchases, water bills, maintenance and
            contracts in one place — on your laptop or your phone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create a landlord account
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl bg-card p-6 ring-1 ring-border">
            <f.icon className="size-5 text-primary" />
            <h2 className="mt-4 font-display text-[15px] font-semibold">{f.title}</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-8 text-center text-[12px] text-muted-foreground">
        NyumbaPro · Property & tenant management for Tanzania
      </footer>
    </div>
  );
}
