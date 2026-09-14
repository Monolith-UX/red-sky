-- close_account appended with `v_kept || 'orders'`, which Postgres reads as
-- array || array and rejects ("malformed array literal"). array_append is
-- unambiguous. Replacing the function keeps its grants.
create or replace function public.close_account(p_user uuid)
returns text[]
language plpgsql
set search_path = ''
as $$
declare
  v_email text;
  v_contact text;
  v_kept text[] := '{}';
  v_n int;
begin
  select email into v_email from public.users where id = p_user;
  if v_email is null then
    return null;
  end if;
  select nullif(email, '') into v_contact from public.profiles where owner = p_user;

  if exists (select 1 from public.placed_orders where owner = p_user) then
    insert into public.retained (owner, email) values (p_user, v_email) on conflict (owner) do nothing;
    v_kept := array_append(v_kept, 'orders');
  end if;

  delete from public.users where id = p_user; -- sessions go with it
  delete from public.favorites where owner = p_user;
  delete from public.waitlist where owner = p_user;
  delete from public.profiles where owner = p_user;
  delete from public.carts where owner = p_user;
  delete from public.standing_orders where owner = p_user;

  delete from public.stories where owner = p_user and status <> 'published';
  update public.stories set owner = null where owner = p_user;
  get diagnostics v_n = row_count;
  if v_n > 0 then
    v_kept := array_append(v_kept, 'stories');
  end if;

  if exists (select 1 from public.messages where email in (v_email, v_contact)) then
    v_kept := array_append(v_kept, 'messages');
  end if;
  if exists (select 1 from public.subscribers where email in (v_email, v_contact)) then
    v_kept := array_append(v_kept, 'list');
  end if;
  return v_kept;
end;
$$;
