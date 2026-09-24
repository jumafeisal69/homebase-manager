import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Loosely-typed accessor: table names are dynamic across the app's modules. */
export const db = supabase as any;

export type Filter = {
  col: string;
  op?: "eq" | "neq" | "gte" | "lte" | "in" | "is" | "ilike";
  value: unknown;
};

export interface RowsOptions {
  select?: string;
  order?: { col: string; asc?: boolean };
  filters?: Filter[];
  limit?: number;
  enabled?: boolean;
}

function applyFilters(query: any, filters: Filter[] = []) {
  let q = query;
  for (const f of filters) {
    if (f.value === undefined || f.value === null || f.value === "" || f.value === "all") continue;
    switch (f.op ?? "eq") {
      case "gte":
        q = q.gte(f.col, f.value);
        break;
      case "lte":
        q = q.lte(f.col, f.value);
        break;
      case "neq":
        q = q.neq(f.col, f.value);
        break;
      case "in":
        q = q.in(f.col, f.value as unknown[]);
        break;
      case "is":
        q = q.is(f.col, f.value);
        break;
      case "ilike":
        q = q.ilike(f.col, `%${String(f.value)}%`);
        break;
      default:
        q = q.eq(f.col, f.value);
    }
  }
  return q;
}

export function useRows<T>(table: string, opts: RowsOptions = {}) {
  return useQuery({
    queryKey: [table, opts.select ?? "*", opts.filters ?? [], opts.order ?? null, opts.limit ?? null],
    enabled: opts.enabled ?? true,
    queryFn: async (): Promise<T[]> => {
      let q = db.from(table).select(opts.select ?? "*");
      q = applyFilters(q, opts.filters);
      if (opts.order) q = q.order(opts.order.col, { ascending: opts.order.asc ?? false });
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw new Error(friendly(error.message));
      return (data ?? []) as T[];
    },
  });
}

export function useRow<T>(table: string, id: string | undefined, select = "*") {
  return useQuery({
    queryKey: [table, "one", id, select],
    enabled: Boolean(id),
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await db.from(table).select(select).eq("id", id).maybeSingle();
      if (error) throw new Error(friendly(error.message));
      return (data ?? null) as T | null;
    },
  });
}

/** Turns raw database errors into language a landlord can act on. */
export function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("one_active_room")) return "That room already has an active tenant.";
  if (m.includes("one_active_tenant")) return "That tenant is already assigned to another room.";
  if (m.includes("rooms_building_id_room_number_key")) return "A room with that number already exists in this building.";
  if (m.includes("rent_charges_tenant_id_period_month_key")) return "A rent charge for that tenant and month already exists.";
  if (m.includes("duplicate key")) return "That record already exists.";
  if (m.includes("violates check constraint")) return "Please enter an amount greater than zero.";
  if (m.includes("row-level security") || m.includes("permission denied")) return "You do not have permission to do that.";
  if (m.includes("failed to fetch")) return "Network problem. Check your connection and try again.";
  return message;
}

export function useSave(table: string, label = "Record") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown> & { id?: string }) => {
      const { id, ...rest } = values;
      if (id) {
        const { data, error } = await db.from(table).update(rest).eq("id", id).select().maybeSingle();
        if (error) throw new Error(friendly(error.message));
        return data;
      }
      const { data, error } = await db.from(table).insert(rest).select().maybeSingle();
      if (error) throw new Error(friendly(error.message));
      return data;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries();
      toast.success(`${label} ${vars.id ? "updated" : "saved"}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemove(table: string, label = "Record") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw new Error(friendly(error.message));
    },
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success(`${label} deleted`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function logAudit(action: string, entity: string, description: string, entityId?: string) {
  try {
    await db.from("audit_logs").insert({ action, entity, description, entity_id: entityId ?? null });
  } catch {
    /* audit logging must never block the user */
  }
}

export async function notify(userId: string, title: string, body: string, kind = "info") {
  try {
    await db.from("notifications").insert({ user_id: userId, title, body, kind });
  } catch {
    /* notifications are best-effort */
  }
}
