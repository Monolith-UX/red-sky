-- Red Sky storefront: everything that belongs to a visitor rather than to the
-- catalogue. The catalogue itself (sequences, lots, prices) stays in code.
--
-- Access model: the site talks to this database only from its server, with
-- the secret (service role) key, which bypasses row-level security. RLS is on
-- for every table with no policies at all, and the anon/authenticated roles
-- have their grants revoked, so the public key can read and write nothing.
--
-- "owner" is a signed-in user's id or a guest browser's visitor id. Guests
-- have no users row, so owner columns carry no foreign key.

/* ── Accounts ─────────────────────────────────────────────── */

create table public.users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  created timestamptz not null default now()
);

-- sha256 of the session token, so the table holds no live tokens.
create table public.sessions (
  hash text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  persistent boolean not null,
  created timestamptz not null,
  expires timestamptz not null
);
create index sessions_user_idx on public.sessions (user_id);
create index sessions_expires_idx on public.sessions (expires);

create table public.profiles (
  owner uuid primary key,
  name text not null default '',
  organisation text not null default '',
  email text not null default '',
  avatar_type text check (avatar_type in ('image/png', 'image/jpeg', 'image/webp')),
  avatar_version bigint,
  address jsonb
);

/* ── Saved things ─────────────────────────────────────────── */

create table public.favorites (
  slug text not null,
  owner uuid not null,
  created timestamptz not null default now(),
  primary key (slug, owner)
);
create index favorites_owner_idx on public.favorites (owner);

create table public.waitlist (
  slug text not null,
  owner uuid not null,
  email text not null,
  joined timestamptz not null default now(),
  primary key (slug, owner)
);
create index waitlist_owner_idx on public.waitlist (owner);

-- A cart is small and always read and written whole.
create table public.carts (
  owner uuid primary key,
  lines jsonb not null default '[]'::jsonb
);

/* ── Orders ───────────────────────────────────────────────── */

create table public.placed_orders (
  ref text primary key,
  owner uuid not null,
  placed timestamptz not null,
  lines jsonb not null,
  weekday smallint check (weekday between 1 and 3),
  standing text[] not null default '{}',
  totals jsonb,
  address jsonb
);
create index placed_orders_owner_idx on public.placed_orders (owner);

create table public.standing_orders (
  id text primary key,
  owner uuid not null,
  slug text not null,
  quantity smallint not null check (quantity between 1 and 20),
  weekday smallint not null check (weekday between 1 and 3),
  status text not null check (status in ('active', 'paused')),
  next_dispatch date not null,
  created date not null
);
create index standing_orders_owner_idx on public.standing_orders (owner);

-- A closed account's placed orders stay in placed_orders under its old id,
-- held for lot traceability; this records whose they were and when.
create table public.retained (
  owner uuid primary key,
  email text not null,
  closed timestamptz not null default now()
);

/* ── Correspondence ───────────────────────────────────────── */

create table public.messages (
  ref text primary key,
  received timestamptz not null,
  topic text not null,
  name text not null,
  email text not null,
  organisation text not null default '',
  lot text not null default '',
  message text not null
);
create index messages_email_idx on public.messages (email);

create table public.stories (
  id text primary key,
  received timestamptz not null,
  status text not null check (status in ('pending', 'flagged', 'published', 'rejected')),
  owner uuid,
  email text not null,
  name text not null,
  role text not null default '',
  organisation text not null default '',
  location text not null default '',
  slugs text[] not null default '{}',
  lot text not null default '',
  title text not null,
  story text not null,
  outcome text not null default '',
  verified_order boolean not null default false,
  flags text[] not null default '{}',
  published timestamptz
);
create index stories_status_idx on public.stories (status);
create index stories_owner_idx on public.stories (owner);

create table public.subscribers (
  email text primary key,
  joined timestamptz not null default now()
);

-- Rate limiting shared by every server instance.
create table public.attempts (
  key text not null,
  at timestamptz not null default now()
);
create index attempts_key_at_idx on public.attempts (key, at);

/* ── Counts ───────────────────────────────────────────────── */

create view public.favorite_counts with (security_invoker = true) as
  select slug, count(*)::int as n from public.favorites group by slug;

create view public.waitlist_counts with (security_invoker = true) as
  select slug, count(*)::int as n from public.waitlist group by slug;

/* ── Operations that must happen in one transaction ───────── */

-- Signing in keeps what the guest did before it. The carts are concatenated;
-- the app normalises a cart (merging duplicates, clamping) whenever it reads one.
create function public.merge_owner(p_from uuid, p_into uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_from = p_into then
    return;
  end if;

  insert into public.favorites (slug, owner, created)
    select slug, p_into, created from public.favorites where owner = p_from
    on conflict do nothing;
  delete from public.favorites where owner = p_from;

  insert into public.waitlist (slug, owner, email, joined)
    select slug, p_into, email, joined from public.waitlist where owner = p_from
    on conflict do nothing;
  delete from public.waitlist where owner = p_from;

  insert into public.carts (owner, lines)
    select p_into, lines from public.carts
    where owner = p_from and jsonb_array_length(lines) > 0
    on conflict (owner) do update set lines = public.carts.lines || excluded.lines;
  delete from public.carts where owner = p_from;

  insert into public.profiles (owner, name, organisation, email)
    select p_into, name, organisation, email from public.profiles where owner = p_from
    on conflict (owner) do update set
      name = coalesce(nullif(public.profiles.name, ''), excluded.name),
      organisation = coalesce(nullif(public.profiles.organisation, ''), excluded.organisation),
      email = coalesce(nullif(public.profiles.email, ''), excluded.email);
  delete from public.profiles where owner = p_from;
end;
$$;

-- One write: record the order, open its standing orders, empty the cart.
create function public.place_order(p_owner uuid, p_order jsonb, p_standing jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.placed_orders (ref, owner, placed, lines, weekday, standing, totals, address)
  values (
    p_order ->> 'ref',
    p_owner,
    (p_order ->> 'placed')::timestamptz,
    p_order -> 'lines',
    (p_order ->> 'weekday')::smallint,
    array(select jsonb_array_elements_text(coalesce(p_order -> 'standing', '[]'::jsonb))),
    p_order -> 'totals',
    p_order -> 'address'
  );

  insert into public.standing_orders (id, owner, slug, quantity, weekday, status, next_dispatch, created)
    select s ->> 'id', p_owner, s ->> 'slug', (s ->> 'quantity')::smallint,
           (s ->> 'weekday')::smallint, s ->> 'status', (s ->> 'nextDispatch')::date, (s ->> 'created')::date
    from jsonb_array_elements(p_standing) as s;

  insert into public.carts (owner, lines) values (p_owner, '[]'::jsonb)
    on conflict (owner) do update set lines = '[]'::jsonb;
end;
$$;

-- Closes an account in one transaction and returns what was kept, as the
-- privacy policy describes: 'orders', 'stories', 'messages', 'list'.
-- Returns null when there is no such user. The photo is removed by the app.
create function public.close_account(p_user uuid)
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
    v_kept := v_kept || 'orders';
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
    v_kept := v_kept || 'stories';
  end if;

  if exists (select 1 from public.messages where email in (v_email, v_contact)) then
    v_kept := v_kept || 'messages';
  end if;
  if exists (select 1 from public.subscribers where email in (v_email, v_contact)) then
    v_kept := v_kept || 'list';
  end if;
  return v_kept;
end;
$$;

-- Records an attempt at p_key, or refuses it once p_limit fall in the window.
-- The advisory lock makes check-and-insert atomic per key.
create function public.allow_attempt(p_key text, p_limit int, p_window_ms bigint)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_n int;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from public.attempts where key = p_key and at < now() - make_interval(secs => p_window_ms / 1000.0);
  -- An occasional sweep, so keys nobody retries do not accumulate.
  if random() < 0.01 then
    delete from public.attempts where at < now() - interval '2 days';
  end if;
  select count(*) into v_n from public.attempts where key = p_key;
  if v_n >= p_limit then
    return false;
  end if;
  insert into public.attempts (key) values (p_key);
  return true;
end;
$$;

/* ── Locking it down ──────────────────────────────────────── */

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.waitlist enable row level security;
alter table public.carts enable row level security;
alter table public.placed_orders enable row level security;
alter table public.standing_orders enable row level security;
alter table public.retained enable row level security;
alter table public.messages enable row level security;
alter table public.stories enable row level security;
alter table public.subscribers enable row level security;
alter table public.attempts enable row level security;

revoke all on all tables in schema public from anon, authenticated;
-- Explicit, in case the project is set not to grant new tables to the API roles.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
revoke all on function public.merge_owner(uuid, uuid) from public, anon, authenticated;
revoke all on function public.place_order(uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.close_account(uuid) from public, anon, authenticated;
revoke all on function public.allow_attempt(text, int, bigint) from public, anon, authenticated;
grant execute on function public.merge_owner(uuid, uuid) to service_role;
grant execute on function public.place_order(uuid, jsonb, jsonb) to service_role;
grant execute on function public.close_account(uuid) to service_role;
grant execute on function public.allow_attempt(text, int, bigint) to service_role;

/* ── Storage: profile photos ──────────────────────────────── */

-- Private; the app reads and writes with the secret key and serves photos
-- through its own route, only to their owner. 512 KB, three image types.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 524288, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
