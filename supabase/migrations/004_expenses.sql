-- Tabela de despesas
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade,
  title text not null,
  category text, -- equipment, travel, food, other
  amount numeric not null,
  expense_date date not null,
  payment_method text, -- cash, card, transfer
  notes text,
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table expenses enable row level security;

create policy "Usuário acessa apenas suas despesas"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index expenses_user_id_idx on expenses(user_id);
create index expenses_event_id_idx on expenses(event_id);
create index expenses_date_idx on expenses(expense_date);
