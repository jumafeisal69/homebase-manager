-- ============ ENUMS ============
create type public.app_role as enum ('admin','manager','tenant');
create type public.room_status as enum ('vacant','occupied','reserved','maintenance');
create type public.tenant_status as enum ('active','pending','moved_out','suspended');
create type public.payment_status as enum ('paid','partially_paid','pending','overdue');
create type public.payment_method as enum ('cash','bank','mobile_money','other');
create type public.contract_status as enum ('active','expiring_soon','expired','terminated');
create type public.maintenance_status as enum ('submitted','accepted','in_progress','completed','rejected');
create type public.maintenance_priority as enum ('low','medium','high','urgent');
create type public.maintenance_category as enum ('electricity','water','plumbing','door','window','internet','security','other');
create type public.txn_source as enum ('manual','api');

-- ============ CORE IDENTITY ============
create table public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  email text,
  avatar_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "claim own role" on public.user_roles for insert to authenticated with check (user_id = auth.uid() and role <> 'admin'::public.app_role);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ============ PROPERTIES ============
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  name text not null,
  address text,
  region text,
  district text,
  ward text,
  street text,
  description text,
  status text not null default 'active',
  is_demo boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_managers (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null,
  owner_id uuid not null default auth.uid(),
  can_edit boolean not null default true,
  created_at timestamptz not null default now(),
  unique (property_id, user_id)
);
grant select, insert, update, delete on public.property_managers to authenticated;
grant all on public.property_managers to service_role;
alter table public.property_managers enable row level security;
create policy "owner manages managers" on public.property_managers for all to authenticated
  using (owner_id = auth.uid() or user_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.manages_property(_property_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.property_managers where property_id = _property_id and user_id = auth.uid())
$$;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  user_id uuid,
  property_id uuid references public.properties(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  national_id text,
  gender text,
  date_of_birth date,
  emergency_contact text,
  emergency_phone text,
  address text,
  photo_url text,
  date_joined date not null default current_date,
  status public.tenant_status not null default 'active',
  is_demo boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.my_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.tenants where user_id = auth.uid() limit 1
$$;

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  building_number text,
  description text,
  floors integer not null default 1,
  status text not null default 'active',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  building_id uuid not null references public.buildings(id) on delete cascade,
  room_number text not null,
  floor integer not null default 0,
  room_type text,
  monthly_rent numeric(14,2) not null default 0,
  deposit_amount numeric(14,2) not null default 0,
  electricity_meter text,
  water_meter text,
  status public.room_status not null default 'vacant',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, room_number)
);

create table public.tenant_assignments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  move_in_date date not null default current_date,
  move_out_date date,
  monthly_rent numeric(14,2) not null default 0,
  deposit numeric(14,2) not null default 0,
  start_meter_electricity text,
  start_meter_water text,
  is_active boolean not null default true,
  move_out_notes text,
  deposit_refunded numeric(14,2),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index one_active_room on public.tenant_assignments(room_id) where is_active;
create unique index one_active_tenant on public.tenant_assignments(tenant_id) where is_active;

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  monthly_rent numeric(14,2) not null default 0,
  deposit numeric(14,2) not null default 0,
  status public.contract_status not null default 'active',
  document_url text,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create sequence public.receipt_seq;

create table public.rent_charges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  period_month date not null,
  amount numeric(14,2) not null,
  amount_paid numeric(14,2) not null default 0,
  due_date date not null,
  status public.payment_status not null default 'pending',
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, period_month)
);

create table public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  charge_id uuid references public.rent_charges(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null default current_date,
  method public.payment_method not null default 'cash',
  reference text,
  notes text,
  receipt_number text not null default ('RCP-' || lpad(nextval('public.receipt_seq')::text, 6, '0')),
  source public.txn_source not null default 'manual',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.electricity_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  meter_number text,
  purchase_date date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  units numeric(12,2),
  token text,
  reference text,
  method public.payment_method not null default 'cash',
  receipt_url text,
  notes text,
  source public.txn_source not null default 'manual',
  receipt_number text not null default ('ELEC-' || lpad(nextval('public.receipt_seq')::text, 6, '0')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.water_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  meter_number text,
  payment_date date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  units numeric(12,2),
  reference text,
  method public.payment_method not null default 'cash',
  receipt_url text,
  notes text,
  source public.txn_source not null default 'manual',
  receipt_number text not null default ('WTR-' || lpad(nextval('public.receipt_seq')::text, 6, '0')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  category public.maintenance_category not null default 'other',
  description text not null,
  priority public.maintenance_priority not null default 'medium',
  status public.maintenance_status not null default 'submitted',
  photo_url text,
  technician text,
  admin_notes text,
  cost numeric(14,2) not null default 0,
  receipt_url text,
  completed_at date,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  property_id uuid references public.properties(id) on delete cascade,
  category text not null default 'other',
  amount numeric(14,2) not null check (amount > 0),
  expense_date date not null default current_date,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_by uuid default auth.uid(),
  title text not null,
  body text,
  kind text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid() or created_by = auth.uid());
create policy "create notifications" on public.notifications for insert to authenticated with check (created_by = auth.uid() or user_id = auth.uid());
create policy "update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid() or created_by = auth.uid());

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  actor_id uuid not null default auth.uid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  description text,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "owner reads audit" on public.audit_logs for select to authenticated using (owner_id = auth.uid() or actor_id = auth.uid());
create policy "actor writes audit" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());

create table public.system_settings (
  owner_id uuid primary key default auth.uid(),
  currency text not null default 'TZS',
  default_due_day integer not null default 5,
  grace_period_days integer not null default 3,
  notify_rent boolean not null default true,
  notify_maintenance boolean not null default true,
  notify_contracts boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.system_settings to authenticated;
grant all on public.system_settings to service_role;
alter table public.system_settings enable row level security;
create policy "own settings" on public.system_settings for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ============ GRANTS + RLS for property-scoped tables ============
do $$
declare t text;
begin
  foreach t in array array['properties','tenants','buildings','rooms','tenant_assignments','contracts','rent_charges','rent_payments','electricity_transactions','water_transactions','maintenance_requests','expenses']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- properties
create policy "properties read" on public.properties for select to authenticated
  using (owner_id = auth.uid() or public.manages_property(id));
create policy "properties insert" on public.properties for insert to authenticated with check (owner_id = auth.uid());
create policy "properties update" on public.properties for update to authenticated using (owner_id = auth.uid() or public.manages_property(id));
create policy "properties delete" on public.properties for delete to authenticated using (owner_id = auth.uid());

-- tenants
create policy "tenants read" on public.tenants for select to authenticated
  using (owner_id = auth.uid() or user_id = auth.uid() or (property_id is not null and public.manages_property(property_id)));
create policy "tenants insert" on public.tenants for insert to authenticated with check (owner_id = auth.uid());
create policy "tenants update" on public.tenants for update to authenticated
  using (owner_id = auth.uid() or user_id = auth.uid() or (property_id is not null and public.manages_property(property_id)));
create policy "tenants delete" on public.tenants for delete to authenticated using (owner_id = auth.uid());

-- generic property-scoped tables
do $$
declare t text;
begin
  foreach t in array array['buildings','rooms','tenant_assignments','contracts','rent_charges','rent_payments','electricity_transactions','water_transactions','expenses']
  loop
    execute format($f$create policy "%1$s read" on public.%1$I for select to authenticated
      using (owner_id = auth.uid() or public.manages_property(property_id) %2$s)$f$, t,
      case when t in ('buildings','rooms','expenses') then '' else 'or tenant_id = public.my_tenant_id()' end);
    execute format('create policy "%1$s insert" on public.%1$I for insert to authenticated with check (owner_id = auth.uid() or public.manages_property(property_id))', t);
    execute format('create policy "%1$s update" on public.%1$I for update to authenticated using (owner_id = auth.uid() or public.manages_property(property_id))', t);
    execute format('create policy "%1$s delete" on public.%1$I for delete to authenticated using (owner_id = auth.uid())', t);
  end loop;
end $$;

-- maintenance
create policy "maintenance read" on public.maintenance_requests for select to authenticated
  using (owner_id = auth.uid() or public.manages_property(property_id) or tenant_id = public.my_tenant_id());
create policy "maintenance insert" on public.maintenance_requests for insert to authenticated
  with check (owner_id = auth.uid() or public.manages_property(property_id) or tenant_id = public.my_tenant_id());
create policy "maintenance update" on public.maintenance_requests for update to authenticated
  using (owner_id = auth.uid() or public.manages_property(property_id));
create policy "maintenance delete" on public.maintenance_requests for delete to authenticated using (owner_id = auth.uid());

-- ============ BUSINESS LOGIC ============
create or replace function public.recalc_charge(_charge_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare paid numeric; amt numeric; due date;
begin
  if _charge_id is null then return; end if;
  select amount, due_date into amt, due from public.rent_charges where id = _charge_id;
  if not found then return; end if;
  select coalesce(sum(amount),0) into paid from public.rent_payments where charge_id = _charge_id;
  update public.rent_charges set amount_paid = paid,
    status = case
      when paid >= amt then 'paid'::public.payment_status
      when paid > 0 then 'partially_paid'::public.payment_status
      when due < current_date then 'overdue'::public.payment_status
      else 'pending'::public.payment_status end
  where id = _charge_id;
end $$;

create or replace function public.tg_payment_recalc()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE','DELETE') then perform public.recalc_charge(old.charge_id); end if;
  if tg_op in ('INSERT','UPDATE') then perform public.recalc_charge(new.charge_id); end if;
  return null;
end $$;
create trigger payment_recalc after insert or update or delete on public.rent_payments
for each row execute function public.tg_payment_recalc();

create or replace function public.tg_assignment_room_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.rooms set status = 'occupied' where id = new.room_id;
  elsif tg_op = 'UPDATE' then
    if new.is_active = false and old.is_active = true then
      update public.rooms set status = 'vacant' where id = new.room_id;
    elsif new.is_active then
      update public.rooms set status = 'occupied' where id = new.room_id;
    end if;
  elsif tg_op = 'DELETE' then
    update public.rooms set status = 'vacant' where id = old.room_id;
  end if;
  return null;
end $$;
create trigger assignment_room_status after insert or update or delete on public.tenant_assignments
for each row execute function public.tg_assignment_room_status();

create or replace function public.tg_touch()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger touch_rooms before update on public.rooms for each row execute function public.tg_touch();
create trigger touch_tenants before update on public.tenants for each row execute function public.tg_touch();
create trigger touch_properties before update on public.properties for each row execute function public.tg_touch();
create trigger touch_maintenance before update on public.maintenance_requests for each row execute function public.tg_touch();

-- refresh overdue statuses on read-heavy endpoints
create or replace function public.refresh_overdue()
returns void language sql security definer set search_path = public as $$
  update public.rent_charges set status = 'overdue'::public.payment_status
  where owner_id = auth.uid() and due_date < current_date and amount_paid < amount and status <> 'overdue';
$$;
grant execute on function public.refresh_overdue() to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.my_tenant_id() to authenticated;
grant execute on function public.manages_property(uuid) to authenticated;