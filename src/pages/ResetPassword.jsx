import { useState, useEffect } from 'react';
import { hardNavigate } from '@/lib/hardNavigate';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  AuthScreen,
  AuthLabel,
  AuthPrimaryButton,
  AuthNotice,
  AA_INPUT_CLASS,
} from '@/components/auth/AllAccessAuth';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

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
    <AuthScreen>
      <div className="flex-1 px-[22px] pt-16 pb-6 flex flex-col gap-3">
        <p className="font-tag text-[11px] tracking-[3px] text-[#ffd400]">NOVA CREDENCIAL</p>
        <h1 className="font-poster text-[44px] leading-none">NOVA SENHA</h1>
        <p className="text-[15px] text-[#c8c8c8] leading-snug">Escolha uma nova senha para sua conta.</p>

        {done ? (
          <div role="status" className="rounded-2xl border-2 border-[#ffd400] p-3.5 flex flex-col gap-2">
            <p className="font-poster text-2xl text-[#ffd400]">SENHA REDEFINIDA ✓</p>
            <p className="text-sm text-[#e0e0e0]">Sua nova senha foi salva com sucesso.</p>
            <button
              type="button"
              onClick={() => hardNavigate('/', { replace: true })}
              className="h-12 rounded-3xl bg-[#ffd400] text-[#0a0a0a] font-poster text-xl tracking-[2px] border-0"
            >
              IR PARA O APP
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {error && <AuthNotice>{error}</AuthNotice>}

            <div>
              <AuthLabel htmlFor="reset-password">Nova senha</AuthLabel>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`${AA_INPUT_CLASS} pr-12`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a8a8] p-1 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <AuthLabel htmlFor="reset-confirm">Confirmar senha</AuthLabel>
              <input
                id="reset-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                className={AA_INPUT_CLASS}
                autoComplete="new-password"
              />
              {confirm.length > 0 && confirm !== password && (
                <p className="text-xs text-[#ff2e88] mt-1.5 font-tag">Senhas não coincidem</p>
              )}
            </div>

            <AuthPrimaryButton disabled={loading || password.length < 6 || password !== confirm}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </AuthPrimaryButton>
          </form>
        )}
      </div>
    </AuthScreen>
  );
}
