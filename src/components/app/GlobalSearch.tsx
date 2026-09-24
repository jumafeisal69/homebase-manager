import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { db } from "@/lib/db";
import { money } from "@/lib/format";

interface Hit {
  id: string;
  label: string;
  hint: string;
  to: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ["global-search", term],
    enabled: open && term.trim().length > 1,
    queryFn: async (): Promise<Hit[]> => {
      const like = `%${term.trim()}%`;
      const [tenants, rooms, properties, payments, maintenance] = await Promise.all([
        db.from("tenants").select("id, full_name, phone, national_id").or(
          `full_name.ilike.${like},phone.ilike.${like},national_id.ilike.${like},email.ilike.${like}`,
        ).limit(5),
        db.from("rooms").select("id, room_number, electricity_meter, water_meter").or(
          `room_number.ilike.${like},electricity_meter.ilike.${like},water_meter.ilike.${like}`,
        ).limit(5),
        db.from("properties").select("id, name, region").ilike("name", like).limit(5),
        db.from("rent_payments").select("id, amount, reference, receipt_number").or(
          `reference.ilike.${like},receipt_number.ilike.${like}`,
        ).limit(5),
        db.from("maintenance_requests").select("id, description, status").ilike("description", like).limit(5),
      ]);

      const out: Hit[] = [];
      for (const t of tenants.data ?? [])
        out.push({ id: `t-${t.id}`, label: t.full_name, hint: t.phone ?? "Tenant", to: `/tenants/${t.id}` });
      for (const r of rooms.data ?? [])
        out.push({ id: `r-${r.id}`, label: `Room ${r.room_number}`, hint: r.electricity_meter ?? "Room", to: "/rooms" });
      for (const p of properties.data ?? [])
        out.push({ id: `p-${p.id}`, label: p.name, hint: p.region ?? "Property", to: "/properties" });
      for (const p of payments.data ?? [])
        out.push({ id: `pay-${p.id}`, label: p.receipt_number, hint: money(p.amount), to: "/rent" });
      for (const m of maintenance.data ?? [])
        out.push({ id: `m-${m.id}`, label: m.description.slice(0, 48), hint: m.status, to: "/maintenance" });
      return out;
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-md items-center gap-2 rounded-lg bg-secondary/60 px-3 text-left text-[13px] text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="truncate">Search tenants, rooms, receipts…</span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search tenants, rooms, properties, receipts…" value={term} onValueChange={setTerm} />
        <CommandList>
          <CommandEmpty>
            {term.trim().length < 2 ? "Type at least 2 characters." : isFetching ? "Searching…" : "Nothing found."}
          </CommandEmpty>
          {hits.length > 0 && (
            <CommandGroup heading="Results">
              {hits.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`${hit.label} ${hit.hint} ${hit.id}`}
                  onSelect={() => {
                    setOpen(false);
                    setTerm("");
                    void navigate({ to: hit.to });
                  }}
                >
                  <span className="truncate">{hit.label}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{hit.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
