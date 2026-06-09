import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function DrilldownModal({ open, onOpenChange, title, items = [], onItemClick }) {
  const exportCsv = () => {
    const headers = ["Título", "Subtítulo", "Valor"];
    const rows = items.map((r) => [
      (r.title || "").replace(/"/g, '""'),
      (r.subtitle || "").replace(/"/g, '""'),
      typeof r.amount === "number" ? r.amount : (r.amountFormatted || "").toString().replace(/[^\d-.,]/g, "")
    ]);
    const csv =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "detalhes-relatorio.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e, row) => {
    if ((e.key === "Enter" || e.key === " ") && onItemClick) {
      e.preventDefault();
      onItemClick(row);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900/95 border-slate-800 text-slate-100 max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 flex-shrink-0">
          <DialogTitle className="text-white min-w-0 flex-1 truncate">{title}</DialogTitle>
          {items?.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv} className="bg-slate-800 border-slate-700 hover:bg-slate-700 flex-shrink-0">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Exportar </span>CSV
            </Button>
          )}
        </DialogHeader>
        <ScrollArea fill className="mt-2">
          <div className="divide-y divide-slate-800">
            {(!items || items.length === 0) ? (
              <p className="text-slate-400 p-4">Sem registros no período selecionado.</p>
            ) : (
              items.map((row, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 hover:bg-slate-800/40 ${onItemClick ? "cursor-pointer" : ""}`}
                  onClick={onItemClick ? () => onItemClick(row) : undefined}
                  onKeyDown={(e) => handleKeyDown(e, row)}
                  role={onItemClick ? "button" : "listitem"}
                  title={onItemClick ? "Clique para ver detalhes" : undefined}
                  tabIndex={onItemClick ? 0 : -1}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{row.title}</p>
                    {row.subtitle && <p className="text-xs text-slate-400 truncate">{row.subtitle}</p>}
                  </div>
                  {row.amount != null && (
                    <div className={`text-sm font-bold ${row.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {row.amountFormatted || row.amount}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}