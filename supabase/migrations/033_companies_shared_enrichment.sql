-- Permite que qualquer usuário autenticado enriqueça o cadastro global de empresas
-- (telefone, logo, e-mail etc.), mantendo delete apenas para o criador.

drop policy if exists "Criador pode atualizar sua empresa" on companies;

create policy "Usuários autenticados podem enriquecer empresas"
  on companies for update
  to authenticated
  using (true)
  with check (true);
