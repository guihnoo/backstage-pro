import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ 
  text = 'Carregando...', 
  size = 'default',
  fullScreen = false 
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base'
  };

  const content = (
    // Sem biblioteca de animação: o spinner aparece na primeira tela e não pode pesar.
    <div className="flex flex-col items-center justify-center gap-4 bp-fade-in">
      <Loader2 className={`${sizeClasses[size]} bp-text-primary animate-spin`} />
      {text && (
        <p className={`${textSizeClasses[size]} text-slate-400 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[100]">
        {content}
      </div>
    );
  }

  return content;
}