-- Feedback fase 2: tipos, contexto, status e inbox do owner

alter table feedback add column if not exists type text default 'suggestion';
alter table feedback add column if not exists page_path text;
alter table feedback add column if not exists app_version text;
alter table feedback add column if not exists screenshot_url text;
alter table feedback add column if not exists status text default 'new';
alter table feedback add column if not exists owner_notes text;
alter table feedback add column if not exists updated_at timestamptz default now();

alter table feedback drop constraint if exists feedback_type_check;
alter table feedback add constraint feedback_type_check
  check (type in ('bug', 'suggestion', 'question', 'praise'));

alter table feedback drop constraint if exists feedback_status_check;
alter table feedback add constraint feedback_status_check
  check (status in ('new', 'in_review', 'resolved'));

create index if not exists feedback_status_created_idx on feedback (status, created_at desc);

-- Role do app (owner = dono / admin de feedbacks)
alter table profiles add column if not exists role text default 'user';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('user', 'owner'));

create or replace function public.is_app_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_app_owner() from public;
grant execute on function public.is_app_owner() to authenticated;

-- Owner: ler e atualizar todos os feedbacks
drop policy if exists "Owner vê todos os feedbacks" on feedback;
create policy "Owner vê todos os feedbacks"
  on feedback for select
  using (public.is_app_owner());

drop policy if exists "Owner atualiza feedbacks" on feedback;
create policy "Owner atualiza feedbacks"
  on feedback for update
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- Ativar owner no Supabase SQL Editor (substitua o e-mail):
-- update profiles set role = 'owner' where id = (select id from auth.users where email = 'seu@email.com');
