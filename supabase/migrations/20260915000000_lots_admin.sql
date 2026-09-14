-- Lots and the staff log, for /admin.
--
-- A lot row replaces the sample lot written in code for its sequence: stock,
-- price, fill, and the figures its certificate reports. Sequence facts
-- (name, formula, average mass, class) stay in code. The site reads these
-- rows at build time, so saving one in /admin triggers a rebuild.

create table public.lots (
  slug text primary key,
  stock text not null check (stock in ('in', 'low', 'out', 'made-to-order', 'upcoming')),
  price numeric(10, 2) not null check (price >= 0),
  fill text not null,
  lot text unique,
  purity numeric(5, 2) check (purity between 0 and 100),
  released date,
  expected date,
  retention numeric(6, 2) check (retention >= 0),
  observed_mass numeric(10, 2) check (observed_mass >= 0),
  water numeric(5, 1) check (water between 0 and 100),
  largest_impurity text,
  analyst text,
  salt text,
  appearance text,
  certificate text,
  sample boolean not null default false,
  updated timestamptz not null default now(),
  updated_by text not null,
  -- A released lot needs its number, purity and date; an upcoming one a date it is expected.
  check (
    (stock = 'upcoming' and expected is not null)
    or (stock <> 'upcoming' and lot is not null and purity is not null and released is not null)
  )
);

-- The privacy policy says staff access to order data is logged; this is that log.
create table public.admin_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  detail jsonb not null default '{}'::jsonb
);
create index admin_log_at_idx on public.admin_log (at desc);

alter table public.lots enable row level security;
alter table public.admin_log enable row level security;
revoke all on public.lots, public.admin_log from anon, authenticated;
grant all on public.lots, public.admin_log to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Certificate PDFs. Private: the site serves them through /api/certificate/<lot>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
