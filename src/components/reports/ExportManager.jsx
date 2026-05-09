import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportReportPdf } from '@/api/functions';
import { exportReportXlsx } from '@/api/functions';

const ExportManager = ({ data, period }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  const handleExport = async (type) => {
    setIsExporting(true);
    setExportType(type);

    try {
      let response;
      let blob;
      let filename;

      if (type === 'pdf') {
        response = await exportReportPdf({ data, dateRange: period });
        if (!response.data) throw new Error("A resposta da função PDF não continha dados.");
        blob = new Blob([response.data], { type: 'application/pdf' });
        filename = `relatorio-backstage-pro-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      } else if (type === 'xlsx') {
        response = await exportReportXlsx({ data, dateRange: period });
        if (!response.data) throw new Error("A resposta da função XLSX não continha dados.");
        blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `relatorio-backstage-pro-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      } else {
        throw new Error("Tipo de exportação inválido");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(`Erro ao exportar ${type.toUpperCase()}:`, error);
      alert(`Erro ao exportar ${type.toUpperCase()}. Verifique o console para mais detalhes.`);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  if (!period || !period.from || !period.to) {
      return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        variant="outline"
        className="border-red-400 text-red-400 hover:bg-red-400/10 flex items-center gap-2 justify-center w-full sm:w-auto"
      >
        {isExporting && exportType === 'pdf' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        PDF
      </Button>
      <Button
        onClick={() => handleExport('xlsx')}
        disabled={isExporting}
        variant="outline"
        className="border-green-400 text-green-400 hover:bg-green-400/10 flex items-center gap-2 justify-center w-full sm:w-auto"
      >
        {isExporting && exportType === 'xlsx' ? (
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