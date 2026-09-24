import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import type { AppRole } from "@/lib/types";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: AppRole;
  tenantId: string | null;
}

/** Profile + role + linked tenant record for the signed-in user. */
export function useCurrentUser() {
  const { user, loading } = useSession();

  const query = useQuery({
    queryKey: ["current-user", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<CurrentUser> => {
      const id = user!.id;
      const metaName = (user!.user_metadata?.["full_name"] as string | undefined) ?? "";

      const [{ data: profile }, { data: roles }, { data: tenant }] = await Promise.all([
        db.from("profiles").select("*").eq("id", id).maybeSingle(),
        db.from("user_roles").select("role").eq("user_id", id),
        db.from("tenants").select("id").eq("user_id", id).maybeSingle(),
      ]);

      if (!profile) {
        await db.from("profiles").insert({
          id,
          full_name: metaName || user!.email?.split("@")[0] || "User",
          email: user!.email,
        });
      }

      const roleList = ((roles ?? []) as { role: AppRole }[]).map((r) => r.role);
      let role: AppRole = roleList.includes("admin")
        ? "admin"
        : roleList.includes("manager")
          ? "manager"
          : roleList.includes("tenant")
            ? "tenant"
            : tenant
              ? "tenant"
              : "admin";

      if (roleList.length === 0) {
        // First sign-in: landlords self-register, tenants are linked by their landlord.
        role = tenant ? "tenant" : "admin";
        await db.from("user_roles").insert({ user_id: id, role });
      }

      return {
        id,
        email: user!.email ?? null,
        fullName: (profile?.full_name as string) || metaName || user!.email || "User",
        phone: (profile?.phone as string) ?? null,
        avatarUrl: (profile?.avatar_url as string) ?? null,
        role,
        tenantId: (tenant?.id as string) ?? null,
      };
    },
  });

  return { ...query, loading: loading || query.isLoading, user };
}
