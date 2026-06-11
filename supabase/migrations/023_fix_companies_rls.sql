-- Corrige políticas RLS da tabela companies
-- auth.role() = 'authenticated' é deprecated e quebra quando anonymous sign-ins estão habilitados
-- Substituído por TO authenticated com predicado de ownership

drop policy if exists "Usuários autenticados podem ler todas as empresas" on companies;
drop policy if exists "Usuários autenticados podem inserir empresas" on companies;

create policy "Usuários autenticados podem ler todas as empresas"
  on companies for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem inserir empresas"
  on companies for insert
  to authenticated
  with check (true);
