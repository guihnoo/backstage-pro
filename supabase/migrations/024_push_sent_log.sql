-- Evita reenviar o mesmo alerta push no mesmo dia
create table if not exists push_sent_log (
  user_id uuid references auth.users(id) on delete cascade not null,
  notification_key text not null,
  sent_date date not null default (timezone('utc', now()))::date,
  sent_at timestamptz default now(),
  primary key (user_id, notification_key, sent_date)
);

alter table push_sent_log enable row level security;

-- Apenas service role / edge functions (sem policy para usuários)
create index if not exists push_sent_log_sent_date_idx on push_sent_log(sent_date);
