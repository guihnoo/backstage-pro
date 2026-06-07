/**
 * Stub para features não disponíveis nesta versão.
 * Retorna contrato compatível com Base44: { data: { success: false, error } }
 */
export function featureUnavailable(name) {
  return async (_args) => ({
    data: { success: false, error: `${name}: funcionalidade não disponível nesta versão.` },
  });
}
