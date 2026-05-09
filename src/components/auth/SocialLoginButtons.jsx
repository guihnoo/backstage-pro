import { motion } from 'framer-motion';
import { Chrome, MessageSquare, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/mockAuth';
import { useNavigate } from 'react-router-dom';

export default function SocialLoginButtons() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleSocialLogin = (provider) => {
    setLoading(provider);
    setTimeout(() => {
      const socialEmail = `user_${provider}@${provider}.com`;
      login(socialEmail, 'social_auth', {
        name: `Usuário ${provider}`,
        role: provider
      });
      navigate('/');
      setLoading(null);
    }, 800);
  };

  const socials = [
    {
      id: 'google',
      name: 'Google',
      icon: Chrome,
      bgColor: 'bg-white/10 hover:bg-white/20',
      textColor: 'text-white',
      borderColor: 'border-white/30'
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: MessageSquare,
      bgColor: 'bg-indigo-600/20 hover:bg-indigo-600/30',
      textColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/50'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: () => <span className="text-lg font-bold">f</span>,
      bgColor: 'bg-blue-600/20 hover:bg-blue-600/30',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/50'
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: () => <span className="text-lg">🍎</span>,
      bgColor: 'bg-gray-700/20 hover:bg-gray-700/30',
      textColor: 'text-gray-300',
      borderColor: 'border-gray-600/50'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {socials.map((social, idx) => {
        const Icon = social.icon;
        return (
          <motion.button
            key={social.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleSocialLogin(social.id)}
            disabled={loading !== null}
            className={`relative p-3 rounded-lg border-2 transition-all ${social.bgColor} ${social.borderColor} group disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading === social.id ? (
              <Loader2 className={`w-5 h-5 ${social.textColor} animate-spin mx-auto`} />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Icon className={`w-5 h-5 ${social.textColor}`} />
                <span className={`text-xs font-medium ${social.textColor}`}>
                  {social.name}
                </span>
              </div>
            )}

            {/* Glow effect on hover */}
            <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-lg ${social.bgColor.split(' ')[1]}`} />
          </motion.button>
        );
      })}
    </div>
  );
}
