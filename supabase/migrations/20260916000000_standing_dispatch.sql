-- Standing orders carry their own delivery address, and staff record each
-- month's shipment. Payment is not connected, so a recorded shipment is an
-- unpaid order record; charging will attach at that step.

alter table public.standing_orders add column address jsonb;

-- Orders from checkout, and shipments recorded from standing orders.
alter table public.placed_orders
  add column source text not null default 'checkout' check (source in ('checkout', 'standing'));

-- Existing standing orders take the address of the order that opened them.
update public.standing_orders s
set address = p.address
from public.placed_orders p
where s.id = any (p.standing) and s.address is null;

-- As before, and the standing orders now keep the order's address.
create or replace function public.place_order(p_owner uuid, p_order jsonb, p_standing jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.placed_orders (ref, owner, placed, lines, weekday, standing, totals, address, source)
  values (
    p_order ->> 'ref',
    p_owner,
    (p_order ->> 'placed')::timestamptz,
    p_order -> 'lines',
    (p_order ->> 'weekday')::smallint,
    array(select jsonb_array_elements_text(coalesce(p_order -> 'standing', '[]'::jsonb))),
    p_order -> 'totals',
    p_order -> 'address',
    coalesce(p_order ->> 'source', 'checkout')
  );

  insert into public.standing_orders (id, owner, slug, quantity, weekday, status, next_dispatch, created, address)
    select s ->> 'id', p_owner, s ->> 'slug', (s ->> 'quantity')::smallint,
           (s ->> 'weekday')::smallint, s ->> 'status', (s ->> 'nextDispatch')::date, (s ->> 'created')::date,
           s -> 'address'
    from jsonb_array_elements(p_standing) as s;

  insert into public.carts (owner, lines) values (p_owner, '[]'::jsonb)
    on conflict (owner) do update set lines = '[]'::jsonb;
end;
$$;

-- One transaction: record a shipment made from standing orders, and move each
-- of them to its next dispatch date.
-- p_advance is [{ "id": "...", "from": "YYYY-MM-DD", "nextDispatch": "YYYY-MM-DD" }].
-- Returns false, writing nothing, unless every order is still active for this owner and
-- still due on "from" — so a second click, or a second member of staff, records nothing.
create function public.record_shipment(p_owner uuid, p_order jsonb, p_advance jsonb)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_expected int := jsonb_array_length(p_advance);
  v_found int;
begin
  perform 1 from public.standing_orders
  where id in (select a ->> 'id' from jsonb_array_elements(p_advance) a)
  for update;

  select count(*) into v_found
  from public.standing_orders o
  join jsonb_array_elements(p_advance) a on o.id = a ->> 'id'
  where o.owner = p_owner and o.status = 'active' and o.next_dispatch = (a ->> 'from')::date;
  if v_found <> v_expected then
    return false;
  end if;

  insert into public.placed_orders (ref, owner, placed, lines, weekday, standing, totals, address, source)
  values (
    p_order ->> 'ref',
    p_owner,
    (p_order ->> 'placed')::timestamptz,
    p_order -> 'lines',
    (p_order ->> 'weekday')::smallint,
    array(select jsonb_array_elements_text(coalesce(p_order -> 'standing', '[]'::jsonb))),
    p_order -> 'totals',
    p_order -> 'address',
    'standing'
  );

  update public.standing_orders o
  set next_dispatch = (a ->> 'nextDispatch')::date
  from jsonb_array_elements(p_advance) a
  where o.id = a ->> 'id' and o.owner = p_owner;
  return true;
end;
$$;

revoke all on function public.record_shipment(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.record_shipment(uuid, jsonb, jsonb) to service_role;
