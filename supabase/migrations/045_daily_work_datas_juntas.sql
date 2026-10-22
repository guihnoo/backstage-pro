-- 045: daily_work — work_date e date sempre juntas
--
-- A tabela tem duas colunas para o mesmo dia: work_date (obrigatória, a original) e date
-- (a que o app usa nas buscas e no índice "um registro por dia"). Em 22/10 o botão CHEGUEI
-- do Início gravava só `date` e o banco recusava ("null value in column work_date"), 5 vezes.
-- O app foi corrigido, mas esta regra garante no banco que nenhuma gravação fique sem uma
-- das duas — inclusive de versões antigas do app ainda abertas no celular.
--
-- Antes de aplicar (22/10): 98 linhas, 0 sem `date`, 0 com work_date diferente de date.
-- Desfazer: drop trigger daily_work_datas_juntas on public.daily_work;
--           drop function public.daily_work_datas_juntas();

create or replace function public.daily_work_datas_juntas()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    -- Mudou só uma das duas (para um dia preenchido): a outra acompanha.
    -- Se uma for apagada, o coalesce abaixo a preenche com a outra.
    if new.date is distinct from old.date and new.date is not null
       and new.work_date is not distinct from old.work_date then
      new.work_date := new.date;
    elsif new.work_date is distinct from old.work_date and new.work_date is not null
       and new.date is not distinct from old.date then
      new.date := new.work_date;
    end if;
  end if;
  new.work_date := coalesce(new.work_date, new.date);
  new.date := coalesce(new.date, new.work_date);
  return new;
end;
$$;

drop trigger if exists daily_work_datas_juntas on public.daily_work;
create trigger daily_work_datas_juntas
  before insert or update on public.daily_work
  for each row execute function public.daily_work_datas_juntas();
