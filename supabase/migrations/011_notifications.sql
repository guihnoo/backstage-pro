create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text,
  type text default 'info',
  priority text default 'medium',
  is_read boolean default false,
  action_url text,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Usuário acessa apenas suas notificações"
  on notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index notifications_user_id_idx on notifications(user_id);
create index notifications_unread_idx on notifications(user_id, is_read) where is_read = false;
