import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Table, Loader2, CalendarDays, Share2 } from 'lucide-react';
import appToast from '@/lib/appToast';

import { exportReportCsv, exportReportPdf, exportCalendarIcs } from '@/lib/exportReport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

function buildShareText(data, period) {
  const events = data?.events || [];
  const expenses = data?.expenses || [];
  const clients = data?.clients || [];

  const revenue = events
    .filter(e => e.payment_status === 'paid')
    .reduce((s, e) => s + (Number(e.paid_amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const profit = revenue - totalExpenses;
  const active = events.filter(e => e.status !== 'cancelled');
  const completed = events.filter(e => e.status === 'completed').length;
  const scheduled = events.filter(e => e.status === 'scheduled' || e.status === 'confirmed').length;
  const uniqueClients = new Set(active.map(e => e.client_id).filter(Boolean)).size;

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

  const label = period?.start
    ? format(new Date(period.start), "MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const lines = [
    `📊 *Relatório — ${label.charAt(0).toUpperCase() + label.slice(1)}*`,
    '',
    `💰 Receita recebida: *${fmt(revenue)}*`,
    totalExpenses > 0 ? `💸 Despesas: ${fmt(totalExpenses)}` : null,
    totalExpenses > 0 ? `📈 Lucro: *${fmt(profit)}*` : null,
    '',
    `📅 Shows: *${active.length}* (${completed} concluídos${scheduled > 0 ? `, ${scheduled} agendados` : ''})`,
    uniqueClients > 0 ? `👥 Clientes ativos: ${uniqueClients}` : null,
    '',
    '_Gerado pelo Backstage Pro_',
  ].filter(l => l !== null);

  return lines.join('\n');
}

const ExportManager = ({ data, period }) => {
  const { primaryHex } = useCategoryTheme();
  const [exporting, setExporting] = useState(null);

  if (!data) return null;

  const handleShare = async () => {
    const text = buildShareText(data, period);
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        if (e.name !== 'AbortError') appToast.error('Erro ao compartilhar');
      }
    } else {
      await navigator.clipboard.writeText(text);
      appToast.success('Resumo copiado!', { description: 'Cole no WhatsApp ou onde preferir.' });
    }
  };

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
        onClick={handleShare}
        variant="outline"
        disabled={!!exporting}
        className="flex items-center gap-2 justify-center w-full sm:w-auto hover:opacity-90"
        style={{
          borderColor: `${primaryHex}80`,
          color: primaryHex,
          backgroundColor: `${primaryHex}14`,
        }}
        title="Compartilhar resumo via WhatsApp ou copiar"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </Button>
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
