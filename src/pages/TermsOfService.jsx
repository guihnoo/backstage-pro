import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Scale, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';

export default function TermsOfServicePage() {
  const { profile } = useAuth();
  const { primaryHex } = getCategoryConfig(profile?.category || 'lighting');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#050609] text-white p-6"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center justify-center gap-3 mb-3">
            <Scale className="w-9 h-9 text-amber-400" />
            Termos de Uso
          </h1>
          <p className="text-slate-400">Backstage Pro — gestão profissional para técnicos e freelancers</p>
          <p className="text-slate-500 text-sm mt-2">Última atualização: junho de 2026</p>
        </div>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: primaryHex }}>
              <FileText className="w-5 h-5" />
              Aceitação
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3 text-sm leading-relaxed">
            <p>
              Ao criar uma conta ou utilizar o Backstage Pro, você concorda com estes Termos de Uso e com nossa{' '}
              <Link to="/privacidade" className="hover:underline" style={{ color: primaryHex }}>Política de Privacidade</Link>.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              Integração Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3 text-sm leading-relaxed">
            <p>
              A sincronização com o Google Calendar é opcional. Ao conectar, você autoriza o Backstage Pro a ler e
              gravar eventos no calendário selecionado, exclusivamente para manter sua agenda profissional atualizada.
            </p>
            <p>
              Você pode desconectar a integração a qualquer momento nas configurações do perfil. Dados já sincronizados
              permanecem na sua conta até que você os exclua.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5" />
              Responsabilidades
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3 text-sm leading-relaxed">
            <p>Você é responsável pelos dados inseridos (clientes, eventos, valores financeiros) e pelo uso da plataforma em conformidade com a legislação aplicável.</p>
            <p>O serviço é fornecido &quot;como está&quot;, com esforços razoáveis de disponibilidade e segurança.</p>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm pt-4">
          <Link to="/login" className="hover:underline" style={{ color: primaryHex }}>Voltar ao login</Link>
        </p>
      </div>
    </motion.div>
  );
}
