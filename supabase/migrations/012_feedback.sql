create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  rating integer check (rating >= 1 and rating <= 5),
  message text not null,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

create policy "Usuário pode enviar feedback"
  on feedback for insert
  with check (auth.uid() = user_id);

create policy "Usuário vê seus feedbacks"
  on feedback for select
  using (auth.uid() = user_id);
