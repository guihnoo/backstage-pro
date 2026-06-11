import { useState, useEffect } from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NeonAtmosphere } from '@/components/design/NeonAtmosphere';
import { NeonGlass } from '@/components/design/NeonGlass';
import { LightingBeams } from '@/components/design/LightingBeams';
import StageBackdrop from '@/components/auth/StageBackdrop';
import { SpotlightRays } from '@/components/auth/SpotlightRays';

const hero = getCategoryConfig(AUTH_HERO_CATEGORY);

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const { isAuthenticated } = useAuth();

  // Se o usuário não tem sessão ativa (link expirado), manda pro login
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) hardNavigate('/login', { replace: true });
    };
    check();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    setError(null);
    try {
      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err.message || 'Não foi possível redefinir a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050609] text-white overflow-x-hidden relative">
      <NeonAtmosphere primary={hero.primaryHex} accent={hero.accentHex} />
      <StageBackdrop />
      <SpotlightRays primary={hero.primaryHex} accent={hero.accentHex} />
      <LightingBeams primary={hero.primaryHex} accent={hero.accentHex} />

      <div className="relative z-10 min-h-screen flex flex-col justify-end px-5 pb-10 pt-16 max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold">Nova senha</h1>
        <p className="font-mono text-xs text-[#8a91a1] mt-2 mb-6">Escolha uma nova senha para sua conta.</p>

        <NeonGlass primary={hero.primaryHex} glow className="p-5 space-y-4">
          {done ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="font-semibold text-white">Senha redefinida!</p>
              <p className="text-sm text-slate-400">Sua nova senha foi salva com sucesso.</p>
              <Button
                onClick={() => hardNavigate('/', { replace: true })}
                className="w-full h-12 border-0 font-bold text-[#06070a]"
                style={{ background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})` }}
              >
                Ir para o app
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">Nova senha</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-[#080a10]/80 border-0 text-white pr-10 h-12 font-mono"
                    style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7283]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#6b7283] mb-2 uppercase">Confirmar senha</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="bg-[#080a10]/80 border-0 text-white h-12 font-mono"
                  style={{ boxShadow: `inset 0 0 0 1px ${hero.primaryHex}33` }}
                  autoComplete="new-password"
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-[11px] text-red-400 mt-1.5 font-mono">Senhas não coincidem</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || password.length < 6 || password !== confirm}
                className="w-full h-12 border-0 font-bold uppercase text-[#06070a]"
                style={{
                  background: `linear-gradient(135deg, ${hero.primaryHex}, ${hero.accentHex})`,
                  boxShadow: `0 0 26px ${hero.primaryHex}55`,
                }}
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
            </form>
          )}
        </NeonGlass>
      </div>
    </div>
  );
}
