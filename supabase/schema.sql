-- Run in the Supabase SQL Editor. Anonymous Sign-Ins must also be enabled in Auth.
create table if not exists public.videos (
  id text primary key,
  title text not null,
  channel text not null,
  handle text not null,
  avatar text not null,
  thumbnail text not null,
  category text not null,
  views text not null,
  uploaded text not null,
  duration text not null,
  description text not null,
  subscribers text not null,
  likes text not null,
  verified boolean not null default false,
  is_short boolean not null default false,
  video_url text,
  sort_order integer not null default 0,
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'published' check (status in ('published'))
);

-- Safe to run again on projects created before uploads existed.
alter table public.videos add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.videos add column if not exists status text not null default 'published';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('video-public', 'video-public', true, 104857600, array['video/mp4', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.user_video_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null references public.videos(id) on delete cascade,
  kind text not null check (kind in ('like', 'save')),
  created_at timestamptz not null default now(),
  primary key (user_id, video_id, kind)
);

create table if not exists public.watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null references public.videos(id) on delete cascade,
  watched_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists public.subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, channel)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null references public.videos(id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_video_created_idx on public.comments (video_id, created_at desc);

alter table public.videos enable row level security;
alter table public.user_video_preferences enable row level security;
alter table public.watch_history enable row level security;
alter table public.subscriptions enable row level security;
alter table public.comments enable row level security;

revoke all on public.videos, public.user_video_preferences, public.watch_history, public.subscriptions, public.comments from anon, authenticated;
grant select on public.videos, public.comments to anon, authenticated;
grant insert on public.videos to authenticated;
grant select, insert, update, delete on public.user_video_preferences, public.watch_history, public.subscriptions to authenticated;
grant insert on public.comments to authenticated;

drop policy if exists "Public videos are readable" on public.videos;
create policy "Public videos are readable" on public.videos for select to anon, authenticated using (status = 'published');
drop policy if exists "Creators can publish videos" on public.videos;
create policy "Creators can publish videos" on public.videos for insert to authenticated
with check (owner_id = (select auth.uid()) and status = 'published' and (select (auth.jwt()->>'is_anonymous')::boolean) is false);

drop policy if exists "Creators can upload media" on storage.objects;
create policy "Creators can upload media" on storage.objects for insert to authenticated
with check (bucket_id = 'video-public' and (storage.foldername(name))[1] = (select auth.uid()::text) and (select (auth.jwt()->>'is_anonymous')::boolean) is false);
drop policy if exists "Creators can inspect media" on storage.objects;
create policy "Creators can inspect media" on storage.objects for select to authenticated
using (bucket_id = 'video-public' and (storage.foldername(name))[1] = (select auth.uid()::text) and (select (auth.jwt()->>'is_anonymous')::boolean) is false);

drop policy if exists "Public comments are readable" on public.comments;
create policy "Public comments are readable" on public.comments for select to anon, authenticated using (true);
drop policy if exists "Users can insert their own comments" on public.comments;
create policy "Users can insert their own comments" on public.comments for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own preferences" on public.user_video_preferences;
create policy "Users can read their own preferences" on public.user_video_preferences for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert their own preferences" on public.user_video_preferences;
create policy "Users can insert their own preferences" on public.user_video_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own preferences" on public.user_video_preferences;
create policy "Users can update their own preferences" on public.user_video_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own preferences" on public.user_video_preferences;
create policy "Users can delete their own preferences" on public.user_video_preferences for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own history" on public.watch_history;
create policy "Users can read their own history" on public.watch_history for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert their own history" on public.watch_history;
create policy "Users can insert their own history" on public.watch_history for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own history" on public.watch_history;
create policy "Users can update their own history" on public.watch_history for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own history" on public.watch_history;
create policy "Users can delete their own history" on public.watch_history for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own subscriptions" on public.subscriptions;
create policy "Users can read their own subscriptions" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert their own subscriptions" on public.subscriptions;
create policy "Users can insert their own subscriptions" on public.subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own subscriptions" on public.subscriptions;
create policy "Users can update their own subscriptions" on public.subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own subscriptions" on public.subscriptions;
create policy "Users can delete their own subscriptions" on public.subscriptions for delete to authenticated using ((select auth.uid()) = user_id);
