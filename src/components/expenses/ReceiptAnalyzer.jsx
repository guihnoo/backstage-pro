import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { UploadFile } from "@/api/integrations";
import { analyzeReceipt } from "@/lib/analyzeReceiptApi";

const CATEGORY_OPTIONS = [
  { value: "transporte", label: "Transporte" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "equipamento", label: "Equipamento" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "combustivel", label: "Combustível" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outros", label: "Outros" },
];

const todayIso = () => new Date().toISOString().split("T")[0];

export default function ReceiptAnalyzer({ open, onOpenChange, onExtract }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [data, setData] = useState({ title: "", amount: "", date: todayIso(), category: "outros", notes: "" });
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const uploadReceipt = async (selectedFile) => {
    setUploading(true);
    let uploadedUrl = null;
    try {
      const { file_url } = await UploadFile({ file: selectedFile, folder: "receipts" });
      uploadedUrl = file_url;
      setFileUrl(file_url);
      if (!data.date) setData((prev) => ({ ...prev, date: todayIso() }));
    } catch (error) {
      console.error("Upload recibo:", error);
      toast.error("Erro ao enviar recibo", { description: error.message || "Tente novamente." });
      setUploading(false);
      return;
    }
    setUploading(false);

    // OCR automático via Gemini Vision
    if (uploadedUrl) {
      setAnalyzing(true);
      try {
        const extracted = await analyzeReceipt(uploadedUrl);
        setData((prev) => ({
          title: extracted.title || prev.title,
          amount: extracted.amount > 0 ? String(extracted.amount) : prev.amount,
          date: extracted.date || prev.date || todayIso(),
          category: extracted.category || prev.category,
          notes: extracted.notes || prev.notes,
        }));
        toast.success("Recibo lido pela IA!", { description: "Verifique os dados e confirme." });
      } catch (err) {
        toast.info("Recibo salvo. Preencha os dados manualmente.", {
          description: err.message?.includes('configurado') ? 'OCR não configurado.' : 'IA indisponível no momento.',
        });
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreviewUrl(URL.createObjectURL(f));
    await uploadReceipt(f);
  };

  const confirm = () => {
    if (!onExtract) return;
    onExtract({
      ...data,
      receipt_url: fileUrl || "",
      amount: data.amount ? Number(data.amount) : 0,
    });
    setPreviewUrl("");
    setFileUrl("");
    setData({ title: "", amount: "", date: todayIso(), category: "outros", notes: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900/95 border-slate-800 text-slate-100 p-0 flex flex-col overflow-hidden max-h-[90dvh]">
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 border-b border-slate-800 flex-shrink-0">
          <DialogTitle>Digitalizar Recibo</DialogTitle>
          <DialogDescription>
            Tire uma foto ou envie o recibo — a IA extrai os dados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea fill>
          <div className="space-y-4 p-4 sm:p-6 pb-2">
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={uploading || analyzing}
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-slate-800 border-slate-700 pointer-events-none h-12"
                  disabled={uploading || analyzing}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : analyzing ? (
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse text-amber-400" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? "Enviando..." : analyzing ? "Lendo com IA..." : "Tirar Foto / Upload"}
                </Button>
              </label>
              {fileUrl && !analyzing && (
                <Button variant="outline" className="w-40 border-green-500/50 text-green-400" disabled>
                  <Upload className="w-4 h-4 mr-2" />
                  Salvo
                </Button>
              )}
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
                  className="bg-slate-800 border-slate-700 h-12 text-base"
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
                  className="bg-slate-800 border-slate-700 h-12 text-base"
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Data</Label>
                <Input
                  type="date"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  className="bg-slate-800 border-slate-700 h-12 text-base"
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
        </ScrollArea>

        <div className="flex gap-2 px-4 py-3 sm:px-6 border-t border-slate-800 flex-shrink-0 pb-safe">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 bg-slate-800 border-slate-700 h-11">
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!data.title || !data.amount || !data.date || analyzing} className="flex-1 h-11">
            Usar dados
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
