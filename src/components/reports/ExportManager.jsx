import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Table } from 'lucide-react';
import { toast } from 'sonner';

const ExportManager = ({ data, period }) => {
  if (!period || !period.from || !period.to) return null;

  const handleExport = (type) => {
    toast.info(`Exportação ${type.toUpperCase()} em breve.`, {
      description: 'Função disponível no próximo update.',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        onClick={() => handleExport('pdf')}
        variant="outline"
        className="border-red-400/50 text-red-400 hover:bg-red-400/10 flex items-center gap-2 justify-center w-full sm:w-auto opacity-60"
      >
        <FileText className="w-4 h-4" />
        PDF (em breve)
      </Button>
      <Button
        onClick={() => handleExport('xlsx')}
        variant="outline"
        className="border-green-400/50 text-green-400 hover:bg-green-400/10 flex items-center gap-2 justify-center w-full sm:w-auto opacity-60"
      >
        <Table className="w-4 h-4" />
        Excel (em breve)
      </Button>
    </div>
  );
};

export default ExportManager;