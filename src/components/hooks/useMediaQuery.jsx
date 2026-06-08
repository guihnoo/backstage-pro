import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => {
      setMatches(media.matches);
    };
    // Adiciona o listener
    try {
      media.addEventListener('change', listener);
    } catch (_e) {
      // Fallback para navegadores mais antigos
      media.addListener(listener);
    }
    
    // Limpa o listener na desmontagem
    return () => {
      try {
        media.removeEventListener('change', listener);
      } catch(_e) {
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}