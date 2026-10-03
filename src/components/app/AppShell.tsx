import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  ClipboardList,
  Droplets,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Receipt,
  Settings,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { GlobalSearch } from "@/components/app/GlobalSearch";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { useRows } from "@/lib/db";
import { initials } from "@/lib/format";
import { setLang, useLang, useT } from "@/lib/i18n";
import type { AppNotification } from "@/lib/types";

const landlordNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/buildings", label: "Buildings", icon: Home },
  { to: "/rooms", label: "Rooms", icon: Gauge },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/rent", label: "Rent & Payments", icon: Receipt },
  { to: "/electricity", label: "Electricity", icon: Zap },
  { to: "/water", label: "Water", icon: Droplets },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/contracts", label: "Contracts", icon: FileText },
  { to: "/reports", label: "Reports", icon: PieChart },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/users", label: "Users & Activity", icon: ClipboardList },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const tenantNav = [
  { to: "/portal", label: "My Home", icon: LayoutDashboard },
  { to: "/portal/payments", label: "Rent & Payments", icon: Receipt },
  { to: "/portal/utilities", label: "Electricity & Water", icon: Zap },
  { to: "/portal/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { data: me } = useCurrentUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = me?.role === "tenant" ? tenantNav : landlordNav;
  const t = useT();

  return (
    <nav className="flex flex-col gap-0.5 text-[13px]">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={
              active
                ? "flex items-center gap-2.5 rounded-md bg-secondary px-3 py-2 font-display font-medium text-foreground"
                : "flex items-center gap-2.5 rounded-md px-3 py-2 font-display text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            }
          >
            <item.icon className="size-4 shrink-0" />
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}

function Identity() {
  const { data: me } = useCurrentUser();
  const t = useT();
  return (
    <div className="mt-auto flex items-center gap-2.5 rounded-xl bg-secondary/60 p-3 ring-1 ring-border">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
        {initials(me?.fullName)}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-display text-[13px] font-medium">{me?.fullName ?? "…"}</div>
        <div className="text-[11px] capitalize text-muted-foreground">
          {t(me?.role === "tenant" ? "Tenant" : me?.role === "manager" ? "Property manager" : "Landlord")}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const { data: unread } = useRows<AppNotification>("notifications", {
    select: "id",
    filters: [{ col: "is_read", value: false }],
    enabled: Boolean(me?.id),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-border p-6 lg:flex">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
              N
            </div>
            <span className="font-display text-[15px] font-semibold">NyumbaPro</span>
          </Link>
          <NavList />
          <Identity />
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-border bg-background p-6">
                <SheetTitle className="mb-6 flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
                    N
                  </div>
                  <span className="font-display text-[15px] font-semibold">NyumbaPro</span>
                </SheetTitle>
                <NavList onNavigate={() => setOpen(false)} />
                <div className="mt-8 flex flex-col">
                  <Identity />
                </div>
              </SheetContent>
            </Sheet>

            <GlobalSearch />

            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitch />
              <Link to="/notifications" className="relative" aria-label="Notifications">
                <Button variant="ghost" size="icon">
                  <Bell className="size-[18px]" />
                </Button>
                {(unread?.length ?? 0) > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
                )}
              </Link>
              <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sign out">
                <LogOut className="size-[18px]" />
              </Button>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function LanguageSwitch() {
  const lang = useLang();
  return (
    <div className="flex rounded-md bg-secondary p-0.5 text-[11px] font-medium ring-1 ring-border" role="group" aria-label="Language">
      {(["en", "sw"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={lang === l ? "rounded px-2 py-1 bg-primary text-primary-foreground" : "rounded px-2 py-1 text-muted-foreground hover:text-foreground"}
        >
          {l === "en" ? "EN" : "SW"}
        </button>
      ))}
    </div>
  );
}
