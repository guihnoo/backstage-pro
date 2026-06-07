import { supabase } from './supabase';

const BUCKET = 'backstage';
const MAX_BYTES = 5 * 1024 * 1024;

function buildObjectPath(userId, folder, file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '') || 'uploads';
  return `${userId}/${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

/**
 * Upload de arquivo para Supabase Storage.
 * Contrato compatível com o legado Base44: { file } → { file_url }
 */
export async function uploadUserFile(file, { folder = 'uploads' } = {}) {
  if (!file) {
    throw new Error('Nenhum arquivo selecionado.');
  }

  if (!file.type?.startsWith('image/')) {
    throw new Error('Envie apenas imagens (JPG, PNG, WebP).');
  }

  if (file.size > MAX_BYTES) {
    throw new Error('Arquivo muito grande. Máximo 5MB.');
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Faça login para enviar arquivos.');
  }

  const path = buildObjectPath(userId, folder, file);
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    if (error.message?.includes('Bucket not found')) {
      throw new Error(
        'Bucket "backstage" não encontrado no Supabase Storage. Verifique o projeto ou contate o suporte.'
      );
    }
    throw error;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { file_url: urlData.publicUrl, path: data.path };
}
