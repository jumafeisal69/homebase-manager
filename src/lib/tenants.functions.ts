import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Landlord creates a portal login for one of their tenants.
 * Verifies the caller owns the tenant row before doing any privileged work.
 */
export const createTenantAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        tenantId: z.string().uuid(),
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as never as {
      supabase: any;
      userId: string;
    };

    // 1. Confirm the tenant belongs to this landlord.
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("id, full_name, user_id, owner_id")
      .eq("id", data.tenantId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!tenant) throw new Error("Tenant not found.");
    if (tenant.user_id) throw new Error("This tenant already has a login.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 2. Create (or reuse) the auth user.
    let authUserId: string | null = null;
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (cErr) {
      if (!cErr.message.toLowerCase().includes("already")) throw new Error(cErr.message);
      // Email already registered — find the existing user and link them.
      const { data: list, error: lErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (lErr) throw new Error(lErr.message);
      const existing = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
      if (!existing) throw new Error("That email is already registered but could not be linked.");
      authUserId = existing.id;
    } else {
      authUserId = created.user?.id ?? null;
    }
    if (!authUserId) throw new Error("Could not create the account.");

    // 3. Ensure the tenant role exists.
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", authUserId)
      .eq("role", "tenant")
      .maybeSingle();
    if (!roleRow) {
      const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: authUserId, role: "tenant" });
      if (rErr) throw new Error(rErr.message);
    }

    // 4. Link the tenant row.
    const { error: uErr } = await supabaseAdmin
      .from("tenants")
      .update({ user_id: authUserId, email: data.email })
      .eq("id", data.tenantId);
    if (uErr) throw new Error(uErr.message);

    return { ok: true as const };
  });
