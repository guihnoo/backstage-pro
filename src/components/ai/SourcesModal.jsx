
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getMentorConfig } from '@/api/functions';
import { updateMentorSources } from '@/api/functions';

export default function SourcesModal({ isOpen, onClose }) {
  const [sources, setSources] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSources = async () => {
        setIsLoading(true);
        try {
          const { data } = await getMentorConfig();
          const sourcesData = data?.sources || [];
          setSources(sourcesData.join('\n'));
        } catch (error) {
          toast.error("Erro ao buscar fontes personalizadas.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSources();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const sourcesArray = sources.split('\n').filter(s => s.trim() !== '');
      await updateMentorSources({ sources: sourcesArray });
      toast.success("Fontes personalizadas salvas com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Não foi possível salvar as fontes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/90 backdrop-blur-lg border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Fontes de Conhecimento Personalizadas</DialogTitle>
          <DialogDescription>
            Adicione links (documentação, manuais, artigos) para que o AI Mentor use como referência em suas respostas. Um link por linha.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <Textarea
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            placeholder="https://exemplo.com/manual-do-equipamento&#10;https://outro.site/documentacao-da-api"
            className="h-40 bg-slate-800 border-slate-700"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Fontes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
