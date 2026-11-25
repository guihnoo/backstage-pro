-- Quem paga cada despesa: cliente reembolsa / cliente paga na hora / eu pago
alter table expenses add column if not exists paid_by text;
update expenses set paid_by = case when is_reimbursable then 'client_reimburses' else 'self' end where paid_by is null;
alter table expenses alter column paid_by set default 'self';
alter table expenses alter column paid_by set not null;
alter table expenses drop constraint if exists expenses_paid_by_check;
alter table expenses add constraint expenses_paid_by_check check (paid_by in ('client_reimburses', 'client_paid', 'self'));
