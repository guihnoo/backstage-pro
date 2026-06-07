import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Table, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportReportCsv, exportReportPdf } from '@/lib/exportReport';

const ExportManager = ({ data, period }) => {
  const [exporting, setExporting] = useState(null);

  if (!data) return null;

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'pdf') {
        exportReportPdf(data, period);
        toast.success('PDF aberto para impressão.', {
          description: 'Use "Salvar como PDF" na janela de impressão.',
        });
      } else {
        exportReportCsv(data, period);
        toast.success('Planilha exportada!', {
          description: 'Arquivo CSV compatível com Excel.',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar relatório', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        onClick={() => handleExport('pdf')}
        variant="outline"
        disabled={!!exporting}
        className="border-red-400/50 text-red-400 hover:bg-red-400/10 flex items-center gap-2 justify-center w-full sm:w-auto"
      >
        {exporting === 'pdf' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        PDF
      </Button>
      <Button
        onClick={() => handleExport('xlsx')}
        variant="outline"
        disabled={!!exporting}
        className="border-green-400/50 text-green-400 hover:bg-green-400/10 flex items-center gap-2 justify-center w-full sm:w-auto"
      >
        {exporting === 'xlsx' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Table className="w-4 h-4" />
        )}
        Excel
      </Button>
    </div>
  );
};

export default ExportManager;
