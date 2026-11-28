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
/**
 * Reduz foto (lado maior até 1600 px, JPEG 80%) para caber no limite do Storage.
 * Fotos de celular costumam passar de 5 MB; sem isso o envio falhava e a leitura da IA era pulada.
 * Se o navegador não conseguir decodificar o arquivo (ex.: HEIC), devolve o original.
 */
async function compressImageForUpload(file, maxSide = 1600, quality = 0.8) {
  if (!file.type?.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;
    const base = (file.name || 'comprovante').replace(/\.[^.]+$/, '');
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export async function uploadUserFile(original, { folder = 'uploads' } = {}) {
  if (!original) {
    throw new Error('Nenhum arquivo selecionado.');
  }

  const isPdf = original.type === 'application/pdf';
  if (!original.type?.startsWith('image/') && !isPdf) {
    throw new Error('Envie uma foto ou PDF (JPG, PNG, WebP, HEIC ou PDF).');
  }

  const file = isPdf ? original : await compressImageForUpload(original);

  if (file.size > MAX_BYTES) {
    throw new Error('Arquivo muito grande mesmo reduzido (máximo 5 MB). Tente outra foto ou um print.');
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
