import { Sparkles } from 'lucide-react';

export default function Logo({ className = "", size = "normal" }) {
  const logoSizes = {
    small: "text-lg",
    normal: "text-xl",
    large: "text-2xl"
  };

  const iconSizes = {
    small: "w-4 h-4",
    normal: "w-5 h-5", 
    large: "w-6 h-6"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Sparkles className={`${iconSizes[size]} text-cyan-400`} />
        <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-30 rounded-full"></div>
      </div>
      <span className={`font-display font-bold text-white tracking-tight ${logoSizes[size]}`}>
        Backstage Pro
      </span>
    </div>
  );
}