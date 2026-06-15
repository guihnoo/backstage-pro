import { useCallback } from 'react';
import { useAuth } from './authContext';
import {
  enrichCompanyById,
  findCompanyByCNPJ,
  searchCompaniesLocal,
  upsertCompanyRecord,
} from './companyService';

/**
 * Banco global de empresas — compartilhado entre todos os usuários.
 * Qualquer usuário pode ler, contribuir e enriquecer campos vazios.
 */
export function useCompanies() {
  const { user } = useAuth();

  const searchLocal = useCallback((query) => searchCompaniesLocal(query, 10), []);

  const findByCNPJ = useCallback((cnpj) => findCompanyByCNPJ(cnpj), []);

  const upsertCompany = useCallback(
    (companyData) => upsertCompanyRecord(companyData, user?.id),
    [user?.id],
  );

  const enrichCompany = useCallback(
    (companyId, patch) => enrichCompanyById(companyId, patch),
    [],
  );

  return { searchLocal, findByCNPJ, upsertCompany, enrichCompany };
}

export {
  enrichCompanyById,
  findCompanyByCNPJ,
  searchCompaniesLocal,
  upsertCompanyRecord,
} from './companyService';
