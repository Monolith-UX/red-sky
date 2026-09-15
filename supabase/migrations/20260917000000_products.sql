-- Products, managed in /admin/products. Until the first product is saved the
-- site keeps the sample products written in code; from then on it is built
-- from this table (at build time, like lots). A lot row, if there is one,
-- still replaces a product's shelf values.

create table public.products (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  formula text not null,
  mass text not null,
  klass text not null check (klass in ('repair', 'secretagogue', 'metabolic', 'neuro', 'longevity', 'endocrine')),
  note text not null,
  sequence text,
  salt text,
  appearance text,
  -- [{ "id": "...", "type": "image/webp", "alt": "...", "version": 1 }], first is the main image.
  images jsonb not null default '[]'::jsonb,
  stock text not null check (stock in ('in', 'low', 'out', 'made-to-order', 'upcoming')),
  price numeric(10, 2) not null check (price >= 0),
  fill text not null,
  retention numeric(6, 2) not null default 10,
  lot text,
  purity numeric(5, 2) check (purity between 0 and 100),
  released date,
  expected date,
  position integer not null default 0,
  -- Removed from the site but kept, so past orders still name it.
  archived boolean not null default false,
  updated timestamptz not null default now(),
  updated_by text not null
);
create index products_position_idx on public.products (position);

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant all on public.products to service_role;

-- Product photos. Private, like the other buckets: the site serves them through
-- /api/product-image/<slug>/<id>. 4 MB each, three image types.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', false, 4194304, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
