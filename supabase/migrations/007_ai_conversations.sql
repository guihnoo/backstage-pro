-- Tabela de conversas com o AI Mentor
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  messages jsonb default '[]',
  context jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ai_conversations enable row level security;

create policy "Usuário acessa apenas suas conversas"
  on ai_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index ai_conversations_user_id_idx on ai_conversations(user_id);
create index ai_conversations_created_at_idx on ai_conversations(created_at desc);
