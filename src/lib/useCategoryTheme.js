import { useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';

/**
 * Tema visual derivado da categoria do profissional (cor primária, accent, tokens).
 * Use em CTAs, empty states e superfícies ativas — evita cyan hardcoded.
 */
export function useCategoryTheme(overrideCategory) {
  const { profile } = useAuth();
  const categoryId = overrideCategory ?? profile?.category ?? 'lighting';

  return useMemo(() => {
    const config = getCategoryConfig(categoryId);
    const { primaryHex, accentHex, bgGlow } = config;

    return {
      ...config,
      categoryId,
      cssVars: {
        '--bp-primary': primaryHex,
        '--bp-accent': accentHex,
        '--bp-glow': bgGlow,
      },
      primaryStyle: { backgroundColor: primaryHex },
      accentStyle: { color: accentHex },
      activeSurfaceClass: 'border',
      activeSurfaceStyle: {
        background: `${primaryHex}22`,
        borderColor: `${primaryHex}55`,
      },
      focusRingStyle: {
        boxShadow: `0 0 0 2px ${primaryHex}40`,
      },
      mutedText: '#8a91a1',
    };
  }, [categoryId]);
}

export function getCategoryTheme(categoryId) {
  const config = getCategoryConfig(categoryId || 'lighting');
  const { primaryHex, accentHex, bgGlow } = config;
  return {
    ...config,
    categoryId: categoryId || 'lighting',
    cssVars: {
      '--bp-primary': primaryHex,
      '--bp-accent': accentHex,
      '--bp-glow': bgGlow,
    },
    primaryStyle: { backgroundColor: primaryHex },
    accentStyle: { color: accentHex },
    activeSurfaceStyle: {
      background: `${primaryHex}22`,
      borderColor: `${primaryHex}55`,
    },
    mutedText: '#8a91a1',
  };
}
