-- 037 — Segurança (auditoria de 15/10/2026). Etapa 0.
--
-- 1) Arquivos (bucket "backstage"): a regra "backstage_public_read" deixava QUALQUER pessoa,
--    mesmo sem login e só com a chave pública do app, LISTAR e ler os arquivos de todos os
--    usuários (fotos de trabalho, recibos, notas fiscais, logos, prints de feedback).
--    Agora cada usuário só lista e lê a própria pasta (<user_id>/...). O dono do app lê os
--    prints da pasta "feedback" para atender os chamados.
--    Os links que o app já gravou continuam abrindo: em bucket público o download por link
--    direto não passa por estas regras, e cada link tem um código aleatório impossível de adivinhar.
--    (Próximo passo, em lote próprio: arquivos sensíveis em bucket privado com link temporário.)
--
-- 2) Empresas (cadastro compartilhado por CNPJ): qualquer usuário logado podia ALTERAR qualquer
--    empresa. Agora quem não criou a empresa só PREENCHE campos vazios (enriquecer continua
--    funcionando), sem apagar ou trocar o que já existe. Quem criou continua podendo editar.
--
-- Idempotente: pode rodar de novo sem erro.

-- ---------- 1) Arquivos ----------
drop policy if exists backstage_public_read on storage.objects;

drop policy if exists backstage_owner_read on storage.objects;
create policy backstage_owner_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'backstage' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists backstage_app_owner_read_feedback on storage.objects;
create policy backstage_app_owner_read_feedback
  on storage.objects for select
  to authenticated
  using (bucket_id = 'backstage' and (storage.foldername(name))[2] = 'feedback' and public.is_app_owner());

-- ---------- 2) Empresas ----------
create or replace function public.companies_somente_enriquecer()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if old.created_by is not null and auth.uid() is distinct from old.created_by then
    -- Identidade da empresa nunca muda por terceiros.
    new.name := old.name;
    new.cnpj := old.cnpj;
    new.created_by := old.created_by;
    new.verified := old.verified;
    new.created_at := old.created_at;
    -- Terceiros só preenchem o que está vazio.
    new.trading_name := coalesce(nullif(old.trading_name, ''), new.trading_name);
    new.city         := coalesce(nullif(old.city, ''), new.city);
    new.state        := coalesce(nullif(old.state, ''), new.state);
    new.address      := coalesce(nullif(old.address, ''), new.address);
    new.phone        := coalesce(nullif(old.phone, ''), new.phone);
    new.email        := coalesce(nullif(old.email, ''), new.email);
    new.website      := coalesce(nullif(old.website, ''), new.website);
    new.logo_url     := coalesce(nullif(old.logo_url, ''), new.logo_url);
    new.cnae         := coalesce(nullif(old.cnae, ''), new.cnae);
    new.porte        := coalesce(nullif(old.porte, ''), new.porte);
    new.status       := coalesce(nullif(old.status, ''), new.status);
    new.source       := coalesce(nullif(old.source, ''), new.source);
  end if;
  return new;
end;
$$;

drop trigger if exists companies_somente_enriquecer on public.companies;
create trigger companies_somente_enriquecer
  before update on public.companies
  for each row execute function public.companies_somente_enriquecer();
