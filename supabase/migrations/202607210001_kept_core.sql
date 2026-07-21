create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.collections (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  cover_item_id uuid,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sync_version bigint not null default 0,
  deleted_at timestamptz
);

create table if not exists public.saved_items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 500),
  description text not null default '',
  notes text not null default '',
  destination_url text,
  normalized_destination_url text,
  destination_domain text not null default '',
  source_url text,
  source_platform text not null default 'Other',
  source_status text not null default 'unchecked' check (source_status in ('available', 'unavailable', 'unchecked')),
  creator_name text not null default '',
  creator_handle text not null default '',
  category text not null default 'Other',
  received_at timestamptz,
  saved_at timestamptz not null,
  last_opened_at timestamptz,
  metadata_status text not null default 'pending' check (metadata_status in ('pending', 'complete', 'partial', 'failed', 'manual')),
  thumbnail_path text,
  state text not null default 'active' check (state in ('active', 'archived', 'trashed')),
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sync_version bigint not null default 0,
  deleted_at timestamptz
);

alter table public.collections drop constraint if exists collections_cover_item_id_fkey;
alter table public.collections add constraint collections_cover_item_id_fkey foreign key (cover_item_id) references public.saved_items(id) on delete set null;

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  saved_item_id uuid not null references public.saved_items(id) on delete cascade,
  sort_order integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (collection_id, saved_item_id)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.item_tags (
  saved_item_id uuid not null references public.saved_items(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (saved_item_id, tag_id)
);

create table if not exists public.shared_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.sync_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('saved_item', 'collection')),
  entity_id uuid not null,
  operation text not null check (operation in ('upsert', 'delete')),
  sync_version bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_items_user_updated_idx on public.saved_items(user_id, updated_at desc);
create index if not exists saved_items_user_normalized_url_idx on public.saved_items(user_id, normalized_destination_url);
create index if not exists collections_user_updated_idx on public.collections(user_id, updated_at desc);
create index if not exists sync_events_user_id_idx on public.sync_events(user_id, id);

alter table public.profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.tags enable row level security;
alter table public.item_tags enable row level security;
alter table public.shared_links enable row level security;
alter table public.sync_events enable row level security;

create policy "profiles_owner" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "saved_items_owner" on public.saved_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "collections_owner" on public.collections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "collection_items_owner" on public.collection_items for all
  using (exists (select 1 from public.collections where collections.id = collection_id and collections.user_id = auth.uid()))
  with check (exists (select 1 from public.collections where collections.id = collection_id and collections.user_id = auth.uid()));
create policy "tags_owner" on public.tags for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "item_tags_owner" on public.item_tags for all
  using (exists (select 1 from public.saved_items where saved_items.id = saved_item_id and saved_items.user_id = auth.uid()))
  with check (exists (select 1 from public.saved_items where saved_items.id = saved_item_id and saved_items.user_id = auth.uid()));
create policy "shared_links_owner" on public.shared_links for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sync_events_owner" on public.sync_events for select using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kept-images', 'kept-images', false, 8388608, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "kept_images_owner_read" on storage.objects for select using (bucket_id = 'kept-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kept_images_owner_write" on storage.objects for insert with check (bucket_id = 'kept-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kept_images_owner_update" on storage.objects for update using (bucket_id = 'kept-images' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'kept-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kept_images_owner_delete" on storage.objects for delete using (bucket_id = 'kept-images' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.delete_account() returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;
