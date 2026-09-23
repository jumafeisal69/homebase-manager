create or replace function public.seed_demo_data()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  prop uuid; blk_a uuid; blk_b uuid;
  r record; t record;
  room_ids uuid[]; tenant_ids uuid[];
  i int; m date;
  charge uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.properties where owner_id = uid and is_demo) then return; end if;

  insert into public.properties (owner_id, name, address, region, district, ward, street, description, is_demo)
  values (uid, 'Sinza Apartments', 'Sinza Mori', 'Dar es Salaam', 'Ubungo', 'Sinza', 'Mori Street', 'Demo property with two blocks', true)
  returning id into prop;

  insert into public.buildings (owner_id, property_id, name, building_number, floors, description, is_demo)
  values (uid, prop, 'Block A', 'A', 2, 'Front block', true) returning id into blk_a;
  insert into public.buildings (owner_id, property_id, name, building_number, floors, description, is_demo)
  values (uid, prop, 'Block B', 'B', 2, 'Rear block', true) returning id into blk_b;

  insert into public.rooms (owner_id, property_id, building_id, room_number, floor, room_type, monthly_rent, deposit_amount, electricity_meter, water_meter, is_demo)
  values
    (uid, prop, blk_a, 'A-01', 0, 'Single room', 300000, 300000, 'LUKU-100101', 'DAWASA-2001', true),
    (uid, prop, blk_a, 'A-02', 0, 'Single room', 300000, 300000, 'LUKU-100102', 'DAWASA-2002', true),
    (uid, prop, blk_a, 'A-03', 1, 'Self contained', 350000, 350000, 'LUKU-100103', 'DAWASA-2003', true),
    (uid, prop, blk_a, 'A-04', 1, 'Self contained', 300000, 300000, 'LUKU-100104', 'DAWASA-2004', true),
    (uid, prop, blk_b, 'B-01', 0, 'Two bedroom', 450000, 450000, 'LUKU-100201', 'DAWASA-2101', true),
    (uid, prop, blk_b, 'B-02', 1, 'Two bedroom', 450000, 450000, 'LUKU-100202', 'DAWASA-2102', true);

  insert into public.tenants (owner_id, property_id, full_name, phone, email, national_id, gender, date_of_birth, emergency_contact, emergency_phone, address, is_demo)
  values
    (uid, prop, 'John Michael', '+255 712 345 678', 'john.michael@example.co.tz', '19900101-12345-00001-01', 'Male', '1990-01-01', 'Neema Michael', '+255 754 111 222', 'Sinza, Dar es Salaam', true),
    (uid, prop, 'Asha Ali', '+255 765 222 333', 'asha.ali@example.co.tz', '19920512-12345-00002-02', 'Female', '1992-05-12', 'Salma Ali', '+255 713 555 666', 'Kinondoni, Dar es Salaam', true),
    (uid, prop, 'David Peter', '+255 786 444 555', 'david.peter@example.co.tz', '19880320-12345-00003-03', 'Male', '1988-03-20', 'Grace Peter', '+255 768 777 888', 'Mbezi, Dar es Salaam', true);

  select array_agg(id order by room_number) into room_ids from public.rooms where owner_id = uid and is_demo;
  select array_agg(id order by full_name) into tenant_ids from public.tenants where owner_id = uid and is_demo;

  -- Asha Ali -> A-01, David Peter -> A-02, John Michael -> A-04
  insert into public.tenant_assignments (owner_id, property_id, room_id, tenant_id, move_in_date, monthly_rent, deposit, is_demo)
  values
    (uid, prop, room_ids[1], tenant_ids[1], current_date - interval '8 months', 300000, 300000, true),
    (uid, prop, room_ids[2], tenant_ids[2], current_date - interval '5 months', 300000, 300000, true),
    (uid, prop, room_ids[4], tenant_ids[3], current_date - interval '11 months', 300000, 300000, true);

  insert into public.contracts (owner_id, property_id, room_id, tenant_id, start_date, end_date, monthly_rent, deposit, status, is_demo)
  values
    (uid, prop, room_ids[1], tenant_ids[1], current_date - interval '8 months', current_date + interval '4 months', 300000, 300000, 'active', true),
    (uid, prop, room_ids[2], tenant_ids[2], current_date - interval '5 months', current_date + interval '7 months', 300000, 300000, 'active', true),
    (uid, prop, room_ids[4], tenant_ids[3], current_date - interval '11 months', current_date + interval '20 days', 300000, 300000, 'expiring_soon', true);

  -- six months of rent charges and payments
  for t in select a.tenant_id, a.room_id, a.monthly_rent from public.tenant_assignments a where a.owner_id = uid and a.is_demo loop
    for i in reverse 5..0 loop
      m := date_trunc('month', current_date)::date - (i || ' months')::interval;
      insert into public.rent_charges (owner_id, property_id, room_id, tenant_id, period_month, amount, due_date, is_demo)
      values (uid, prop, t.room_id, t.tenant_id, m, t.monthly_rent, m + interval '4 days', true)
      returning id into charge;
      if i > 0 then
        insert into public.rent_payments (owner_id, property_id, room_id, tenant_id, charge_id, amount, payment_date, method, reference, is_demo)
        values (uid, prop, t.room_id, t.tenant_id, charge, t.monthly_rent, m + interval '3 days', 'mobile_money', 'MPESA-' || substr(md5(random()::text),1,8), true);
      else
        insert into public.rent_payments (owner_id, property_id, room_id, tenant_id, charge_id, amount, payment_date, method, reference, is_demo)
        values (uid, prop, t.room_id, t.tenant_id, charge, t.monthly_rent * 0.667, m + interval '3 days', 'cash', 'CASH-' || substr(md5(random()::text),1,6), true);
      end if;
    end loop;
  end loop;

  for t in select a.tenant_id, a.room_id, r.electricity_meter, r.water_meter from public.tenant_assignments a join public.rooms r on r.id = a.room_id where a.owner_id = uid and a.is_demo loop
    for i in reverse 3..0 loop
      m := date_trunc('month', current_date)::date - (i || ' months')::interval;
      insert into public.electricity_transactions (owner_id, property_id, room_id, tenant_id, meter_number, purchase_date, amount, units, token, reference, method, is_demo)
      values (uid, prop, t.room_id, t.tenant_id, t.electricity_meter, m + interval '5 days', 30000, 92.4, lpad((random()*9999999999999999)::bigint::text, 16, '0'), 'ELEC-' || (1000 + i * 7 + floor(random()*90))::text, 'mobile_money', true);
      insert into public.water_transactions (owner_id, property_id, room_id, tenant_id, meter_number, payment_date, amount, units, reference, method, is_demo)
      values (uid, prop, t.room_id, t.tenant_id, t.water_meter, m + interval '7 days', 10000, 4.5, 'WTR-' || (2000 + i * 5 + floor(random()*90))::text, 'cash', true);
    end loop;
    insert into public.electricity_transactions (owner_id, property_id, room_id, tenant_id, meter_number, purchase_date, amount, units, token, reference, method, is_demo)
    values (uid, prop, t.room_id, t.tenant_id, t.electricity_meter, date_trunc('month', current_date)::date + interval '17 days', 20000, 61.2, lpad((random()*9999999999999999)::bigint::text, 16, '0'), 'ELEC-' || (1500 + floor(random()*400))::text, 'mobile_money', true);
  end loop;

  insert into public.maintenance_requests (owner_id, property_id, room_id, tenant_id, category, description, priority, status, cost, technician, is_demo)
  values
    (uid, prop, room_ids[4], tenant_ids[3], 'plumbing', 'Leaking tap in the bathroom, water running all night.', 'high', 'in_progress', 0, 'Juma Fundi', true),
    (uid, prop, room_ids[1], tenant_ids[1], 'electricity', 'Socket in the sitting room is not working.', 'medium', 'completed', 45000, 'Said Electrician', true),
    (uid, prop, room_ids[2], tenant_ids[2], 'door', 'Main door lock is stiff and hard to turn.', 'low', 'submitted', 0, null, true);

  insert into public.expenses (owner_id, property_id, category, amount, expense_date, notes, is_demo)
  values (uid, prop, 'security', 250000, current_date - interval '10 days', 'Monthly guard payment', true),
         (uid, prop, 'cleaning', 80000, current_date - interval '20 days', 'Compound cleaning', true);

  insert into public.notifications (user_id, created_by, title, body, kind)
  values (uid, uid, 'Demo data loaded', 'Sinza Apartments demo records were added to your account. You can remove them any time from Settings.', 'info');

  insert into public.audit_logs (owner_id, actor_id, action, entity, description)
  values (uid, uid, 'seed_demo_data', 'system', 'Loaded demo property, tenants and transactions');
end $$;

create or replace function public.clear_demo_data()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  delete from public.rent_payments where owner_id = uid and is_demo;
  delete from public.rent_charges where owner_id = uid and is_demo;
  delete from public.electricity_transactions where owner_id = uid and is_demo;
  delete from public.water_transactions where owner_id = uid and is_demo;
  delete from public.maintenance_requests where owner_id = uid and is_demo;
  delete from public.contracts where owner_id = uid and is_demo;
  delete from public.tenant_assignments where owner_id = uid and is_demo;
  delete from public.expenses where owner_id = uid and is_demo;
  delete from public.tenants where owner_id = uid and is_demo;
  delete from public.rooms where owner_id = uid and is_demo;
  delete from public.buildings where owner_id = uid and is_demo;
  delete from public.properties where owner_id = uid and is_demo;
end $$;

grant execute on function public.seed_demo_data() to authenticated;
grant execute on function public.clear_demo_data() to authenticated;