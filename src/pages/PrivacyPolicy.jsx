import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Database, Lock, UserCheck, FileText, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';

export default function PrivacyPolicyPage() {
  const { profile } = useAuth();
  const { primaryHex } = getCategoryConfig(profile?.category || 'lighting');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#050609] max-w-4xl mx-auto p-6 space-y-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white font-display flex items-center justify-center gap-3 mb-4">
          <Shield className="w-10 h-10" style={{ color: primaryHex }} />
          Política de Privacidade
        </h1>
        <p className="text-slate-400 text-lg">
          Sua privacidade e segurança são nossa prioridade máxima
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Última atualização: junho de 2026
        </p>
      </div>

      <div className="grid gap-6">
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: primaryHex }}>
              <Eye className="w-5 h-5" />
              Transparência Total
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <p>
              O Backstage Pro é uma aplicação de gestão profissional que respeita 
              totalmente sua privacidade e mantém seus dados seguros. Este documento 
              explica como coletamos, usamos e protegemos suas informações.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Dados que Coletamos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <div>
              <h4 className="font-bold text-white mb-2">Informações de Conta:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Nome completo e endereço de e-mail (via Google OAuth)</li>
                <li>Foto de perfil (opcional, via Google)</li>
                <li>Configurações de preferência do aplicativo</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-2">Dados Profissionais:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Informações de eventos e projetos</li>
                <li>Registros de trabalho e horas</li>
                <li>Dados de clientes e contatos</li>
                <li>Despesas e informações financeiras</li>
                <li>Fotos e arquivos anexados voluntariamente</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: primaryHex }}>
              <Calendar className="w-5 h-5" />
              Google Calendar (opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3 text-sm leading-relaxed">
            <p>
              Se você conectar o Google Calendar, armazenamos tokens OAuth de forma segura para sincronizar eventos
              entre o Backstage Pro e o calendário escolhido. Acessamos apenas calendários autorizados por você.
            </p>
            <p>
              Não lemos e-mails, contatos ou outros dados da conta Google além do necessário para a sincronização de agenda.
              Você pode revogar o acesso a qualquer momento em Perfil → Google Calendar ou nas configurações da sua conta Google.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-blue-300 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Como Protegemos Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <div>
              <h4 className="font-bold text-white mb-2">Segurança Técnica:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Criptografia HTTPS em todas as comunicações</li>
                <li>Isolamento completo de dados por usuário</li>
                <li>Autenticação segura via Google OAuth 2.0</li>
                <li>Backup automatizado com redundância</li>
                <li>Políticas de acesso rigorosas no banco de dados</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-2">Privacidade por Design:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Seus dados são visíveis apenas para você</li>
                <li>Não compartilhamos informações com terceiros</li>
                <li>Não vendemos ou monetizamos seus dados</li>
                <li>Zero tracking ou analytics invasivos</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Seus Direitos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <p>Você tem controle total sobre seus dados:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li><strong className="text-white">Acesso:</strong> Visualize todos os seus dados a qualquer momento</li>
              <li><strong className="text-white">Correção:</strong> Edite ou atualize suas informações</li>
              <li><strong className="text-white">Exportação:</strong> Baixe seus dados em formatos padrão</li>
              <li><strong className="text-white">Exclusão:</strong> Delete sua conta e todos os dados associados</li>
              <li><strong className="text-white">Portabilidade:</strong> Transfira seus dados para outro serviço</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="bp-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Integração com Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <p>
              Quando você opta por conectar o Google Calendar:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Acessamos apenas os calendários que você autorizar</li>
              <li>Sincronizamos eventos de forma bidirecional (opcional)</li>
              <li>Tokens de acesso são criptografados e armazenados com segurança</li>
              <li>Você pode desconectar a qualquer momento</li>
              <li>Não modificamos eventos sem sua autorização explícita</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Retenção e Exclusão de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <p>
              <strong className="text-white">Retenção:</strong> Mantemos seus dados enquanto sua conta estiver ativa 
              e você usar o serviço.
            </p>
            <p>
              <strong className="text-white">Exclusão:</strong> Ao excluir sua conta, todos os seus dados são 
              permanentemente removidos de nossos servidores em até 30 dias, exceto 
              informações que precisamos manter por obrigações legais.
            </p>
            <p>
              <strong className="text-white">Backups:</strong> Backups são mantidos por até 90 dias para 
              recuperação de dados em caso de problemas técnicos.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: primaryHex }}>
              <Shield className="w-5 h-5" />
              Contato e Suporte
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-4">
            <p>
              Para questões sobre privacidade, segurança ou exclusão de dados, 
              entre em contato através do sistema de feedback integrado no aplicativo 
              ou pelo e-mail de suporte.
            </p>
            <p className="text-slate-400 text-sm">
              Respondemos a todas as solicitações relacionadas à privacidade em até 48 horas.
            </p>
          </CardContent>
        </Card>

        <div className="text-center pt-8 border-t border-slate-800 space-y-2">
          <p className="text-slate-400 text-sm">
            Esta política pode ser atualizada ocasionalmente. Notificaremos sobre
            mudanças significativas através do aplicativo.
          </p>
          <p className="text-sm">
            <Link to="/termos" className="hover:underline" style={{ color: primaryHex }}>Termos de Uso</Link>
            {' · '}
            <Link to="/login" className="hover:underline" style={{ color: primaryHex }}>Voltar ao login</Link>
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Backstage Pro - Gestão Profissional com Privacidade Total
          </p>
        </div>
      </div>
    </motion.div>
  );
}