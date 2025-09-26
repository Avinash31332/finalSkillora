-- RESET MESSAGES TABLE (drops existing data) - run if you don't need to keep old rows
drop table if exists public.messages cascade;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  message_type text default 'text' check (message_type in ('text','image','file','system')),
  status text default 'sent' check (status in ('sent','delivered','read')),
  reply_to uuid references public.messages(id),
  updated_at timestamptz default now(),
  read_at timestamptz
);

alter table public.messages enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='messages' and policyname='dm_select_sender_or_receiver'
  ) then
    create policy dm_select_sender_or_receiver on public.messages
      for select to authenticated
      using (auth.uid() = sender_id or auth.uid() = receiver_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='messages' and policyname='dm_insert_sender_only'
  ) then
    create policy dm_insert_sender_only on public.messages
      for insert to authenticated
      with check (auth.uid() = sender_id);
  end if;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists touch_messages_updated_at on public.messages;
create trigger touch_messages_updated_at
  before update on public.messages
  for each row execute function public.touch_updated_at();

alter table public.messages replica identity full;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- OPTIONAL: Typing indicators (for typing dots)
create table if not exists public.typing_indicators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  is_typing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

alter table public.typing_indicators enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='typing_indicators' and policyname='typing_select'
  ) then
    create policy typing_select on public.typing_indicators
      for select using (auth.uid() = user_id or auth.uid() = target_user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='typing_indicators' and policyname='typing_insert'
  ) then
    create policy typing_insert on public.typing_indicators
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='typing_indicators' and policyname='typing_update'
  ) then
    create policy typing_update on public.typing_indicators
      for update using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists touch_typing_updated_at on public.typing_indicators;
create trigger touch_typing_updated_at
  before update on public.typing_indicators
  for each row execute function public.touch_updated_at();

alter table public.typing_indicators replica identity full;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='typing_indicators'
  ) then
    alter publication supabase_realtime add table public.typing_indicators;
  end if;
end $$;

-- OPTIONAL: Presence (green dot)
create table if not exists public.user_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  is_online boolean not null default false,
  last_seen timestamptz default now(),
  status_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

alter table public.user_status enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_status' and policyname='user_status_select_all'
  ) then
    create policy user_status_select_all on public.user_status
      for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_status' and policyname='user_status_insert_self'
  ) then
    create policy user_status_insert_self on public.user_status
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_status' and policyname='user_status_update_self'
  ) then
    create policy user_status_update_self on public.user_status
      for update using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists touch_user_status_updated_at on public.user_status;
create trigger touch_user_status_updated_at
  before update on public.user_status
  for each row execute function public.touch_updated_at();

alter table public.user_status replica identity full;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='user_status'
  ) then
    alter publication supabase_realtime add table public.user_status;
  end if;
end $$;


