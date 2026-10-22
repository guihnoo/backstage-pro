import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Edge Function analyze-job: lê um trabalho de uma mensagem (#106 "Ler com IA")
 * ou da foto de uma credencial (#108) com o Gemini.
 * @param {{ mode: 'text'|'image', text?: string, image_base64?: string, mime_type?: string, clients?: string[], functions?: string[] }} body
 */
export async function analyzeJob(body) {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');
  const today = new Date().toLocaleDateString('sv-SE');
  const { data, error } = await supabase.functions.invoke('analyze-job', { body: { today, ...body } });
  if (error) throw new Error(error.message || 'Erro ao ler com a IA.');
  if (!data?.success) throw new Error(data?.error || 'A IA não conseguiu ler.');
  return data.data;
}

/** Foto → JPEG comprimido em base64 (sem o prefixo data:), lado maior até maxSide. */
export function fileToJpegBase64(file, maxSide = 1600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      reject(new Error('Escolha uma foto.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não deu para ler a foto.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Formato de foto não aceito.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width || maxSide, img.height || maxSide));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round((img.width || maxSide) * scale));
        canvas.height = Math.max(1, Math.round((img.height || maxSide) * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1] || '', mimeType: 'image/jpeg' });
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}
