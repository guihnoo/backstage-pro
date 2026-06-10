-- Tipo do cliente: empresa ou pessoa física
alter table clients
  add column if not exists client_type text not null default 'empresa'
    check (client_type in ('empresa', 'pessoa'));
