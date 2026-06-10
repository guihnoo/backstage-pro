-- Colunas de reembolso e descrição separada em despesas
alter table expenses add column if not exists is_reimbursable boolean not null default false;
alter table expenses add column if not exists reimbursed boolean not null default false;
alter table expenses add column if not exists description text;
