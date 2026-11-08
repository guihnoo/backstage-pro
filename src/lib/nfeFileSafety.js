// Só operações do próprio usuário podem remover um objeto identificado pelo app.
function ownedPath(url, userId) {
  if (!url || !userId) return null;
  try {
    const path = decodeURIComponent(new URL(url).pathname.split('/storage/v1/object/public/backstage/')[1] || '');
    return path.startsWith(`${userId}/nfe/`) && !path.split('/').includes('..') ? path : null;
  } catch {
    return null;
  }
}

export async function updateNFeWithLegacyFallback(updateEvent, eventId, patch) {
  try {
    return await updateEvent(eventId, patch);
  } catch (error) {
    const missingColumn = error?.code === '42703' || error?.code === 'PGRST204';
    const numberOnly = Object.keys(patch).every(key => ['nfe_numero', 'nf_number', 'nf_issued_at'].includes(key));
    // Nunca mascarar falha ao vincular arquivo ou gravar análise com um update parcial.
    if (!missingColumn || !numberOnly || patch.nfe_numero === undefined) throw error;
    return updateEvent(eventId, {
      nf_number: patch.nfe_numero,
      ...(patch.nf_issued_at !== undefined ? { nf_issued_at: patch.nf_issued_at } : {}),
    });
  }
}

export async function removePreviousNFe(storage, url, userId) {
  const path = ownedPath(url, userId);
  if (!path) return true;
  try {
    const { error } = await storage.remove([path]);
    return !error;
  } catch {
    return false;
  }
}

export async function replaceNFeFile({ storage, file, userId, eventId, previousUrl, patch, update }) {
  const path = `${userId}/nfe/${eventId}-${crypto.randomUUID()}.pdf`;
  const { data, error } = await storage.upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: 'application/pdf',
  });
  if (error) throw error;
  const { data: urlData } = storage.getPublicUrl(data.path);
  const url = urlData.publicUrl;
  const saved = await update({ ...patch, nfe_arquivo_url: url, nfe_arquivo_nome: file.name });
  if (saved?.nfe_arquivo_url !== url) {
    throw new Error('O vínculo do PDF não foi confirmado. O arquivo anterior foi preservado.');
  }
  // Falha de gravação pode ter resposta ambígua de rede: não apagar o novo objeto
  // no catch. Preservar ambos é preferível a remover um PDF já vinculado no servidor.
  const cleaned = previousUrl === url || await removePreviousNFe(storage, previousUrl, userId);
  return { url, cleanupPending: !cleaned };
}
