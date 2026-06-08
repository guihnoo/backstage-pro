import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Upload, Sparkles, AlertCircle } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { extractExpenseData } from '@/api/functions';
import { toast } from 'sonner';

export default function PhotoReceiptAnalyzer({ onDataExtracted, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleFileSelect = (file) => {
    if (!file) return;
    processReceipt(file);
  };

  const processReceipt = async (file) => {
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Fazer upload do arquivo
      toast.info('Enviando imagem do comprovante...');
      const { file_url } = await UploadFile({ file });

      if (!file_url) {
        throw new Error('Falha ao obter a URL do arquivo após o upload.');
      }
      
      // 2. Chamar a função de extração de dados
      toast.info('Analisando dados com a IA...');
      const { data: extractedData, error: extractionError } = await extractExpenseData({ file_url });

      if (extractionError || !extractedData) {
        throw new Error(extractionError?.message || 'A IA não conseguiu extrair os dados do comprovante. Tente uma foto mais nítida.');
      }
      
      // 3. Enviar dados extraídos para o formulário pai
      toast.success('Dados extraídos com sucesso!');
      onDataExtracted({ ...extractedData, receipt_url: file_url });

    } catch (err) {
      console.error("Erro no processo de análise do comprovante:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-4 space-y-4 bg-slate-800 rounded-lg"
    >
      <div className="flex items-center justify-center gap-2 text-lg font-bold text-purple-300">
        <Sparkles className="w-5 h-5" />
        Analisador de Comprovante
      </div>
      
      <p className="text-slate-300">
        Tire uma foto ou envie uma imagem do seu comprovante. A IA preencherá os campos para você.
      </p>

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center gap-3 h-32">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-purple-300">Analisando... Isso pode levar alguns segundos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Fotografar ou Enviar Imagem
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="hidden"
            accept="image/*"
            capture="environment"
          />
        </div>
      )}

      {error && (
        <div className="text-red-400 flex items-center justify-center gap-2 p-2 bg-red-900/50 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <p>{error}</p>
        </div>
      )}

      <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
        Voltar para o formulário
      </Button>
    </motion.div>
  );
}