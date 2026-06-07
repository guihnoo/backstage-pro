import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: "transporte", label: "Transporte" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "equipamento", label: "Equipamento" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "combustivel", label: "Combustível" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outros", label: "Outros" },
];

export default function ReceiptAnalyzer({ open, onOpenChange, onExtract }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [data, setData] = useState({ title: "", amount: "", date: "", category: "outros", notes: "" });
  const [fileUrl, setFileUrl] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const runExtraction = () => {
    toast.info('Análise automática de recibo em breve.', {
      description: 'Preencha os dados manualmente por enquanto.',
    });
  };

  const confirm = () => {
    if (!onExtract) return;
    onExtract({
      ...data,
      receipt_url: fileUrl || "",
      amount: data.amount ? Number(data.amount) : 0,
    });
    // reset soft
    setFile(null);
    setPreviewUrl("");
    setFileUrl("");
    setData({ title: "", amount: "", date: "", category: "outros", notes: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900/95 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Digitalizar Recibo</DialogTitle>
          <DialogDescription>Faça upload ou tire uma foto para preencher a despesa automaticamente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button variant="outline" className="w-full bg-slate-800 border-slate-700">
                <Camera className="w-4 h-4 mr-2" />
                Tirar Foto / Upload
              </Button>
            </label>
            <Button onClick={runExtraction} disabled={!file} className="w-40 opacity-60">
              <Upload className="w-4 h-4 mr-2" />
              Analisar
            </Button>
          </div>

          {previewUrl && (
            <img src={previewUrl} alt="Pré-visualização do recibo" className="w-full h-40 object-cover rounded border border-slate-700" />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-sm">Título</Label>
              <Input
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="Ex: Almoço, Uber..."
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={data.amount}
                onChange={(e) => setData({ ...data, amount: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Data</Label>
              <Input
                type="date"
                value={data.date}
                onChange={(e) => setData({ ...data, date: e.target.value })}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Categoria</Label>
              <Select value={data.category} onValueChange={(v) => setData({ ...data, category: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Escolha" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Observações</Label>
            <Textarea
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              className="bg-slate-800 border-slate-700 min-h-[80px]"
              placeholder="Opcional"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-slate-800 border-slate-700">
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!data.title || !data.amount || !data.date}>
            Usar dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}