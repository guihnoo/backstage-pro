import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Table, Loader2, CalendarDays } from 'lucide-react';
import appToast from '@/lib/appToast';

import { exportReportCsv, exportReportPdf, exportCalendarIcs } from '@/lib/exportReport';
import { format } from 'date-fns';

const ExportManager = ({ data, period }) => {
  const [exporting, setExporting] = useState(null);

  if (!data) return null;

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === 'pdf') {
        exportReportPdf(data, period);
        appToast.success('PDF aberto para impressão.', {
          description: 'Use "Salvar como PDF" na janela de impressão.',
        });
      } else if (type === 'ics') {
        const events = data?.events || [];
        if (events.length === 0) {
          appToast.error('Nenhum evento no período para exportar.');
          return;
        }
        const label = period?.start ? format(new Date(period.start), 'yyyy-MM') : format(new Date(), 'yyyy-MM');
        exportCalendarIcs(events, data?.clients || [], label);
        appToast.success(`${events.length} evento(s) exportado(s) como ICS`, {
          description: 'Abra o .ics para importar no Google Calendar ou Apple Calendar.',
        });
      } else {
        exportReportCsv(data, period);
        appToast.success('Planilha exportada!', {
          description: 'Arquivo CSV compatível com Excel.',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      appToast.error('Erro ao exportar relatório', {
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
      <Button
        onClick={() => handleExport('ics')}
        variant="outline"
        disabled={!!exporting}
        className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10 flex items-center gap-2 justify-center w-full sm:w-auto"
        title="Exportar eventos como ICS — importável no Google Calendar, Apple Calendar etc."
      >
        {exporting === 'ics' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CalendarDays className="w-4 h-4" />
        )}
        ICS
      </Button>
    </div>
  );
};

export default ExportManager;
