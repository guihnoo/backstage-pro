import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Chama a Edge Function analyze-receipt para extrair dados do recibo via Gemini Vision.
 * @param {string} imageUrl URL pública da imagem no Supabase Storage
 * @returns {{ title, amount, date, category, notes }}
 */
export async function analyzeReceipt(imageUrl) {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado.');

  const { data, error } = await supabase.functions.invoke('analyze-receipt', {
    body: { image_url: imageUrl },
  });

  if (error) throw new Error(error.message || 'Erro ao analisar recibo.');
  if (!data?.success) throw new Error(data?.error || 'Falha na análise do recibo.');

  return data.data;
}
