import { useEffect } from 'react';

export default function KeyboardShortcuts({ 
  onLeft, 
  onRight, 
  onKeyT, 
  onKeyW 
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Evitar conflito quando usuário está digitando em inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onRight?.();
          break;
        case 't':
        case 'T':
          event.preventDefault();
          onKeyT?.();
          break;
        case 'w':
        case 'W':
          event.preventDefault();
          onKeyW?.();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onLeft, onRight, onKeyT, onKeyW]);

  return null; // Componente invisível
}