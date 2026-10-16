import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'icon.svg',
        'icon-maskable.svg',
        'icon-192x192.png',
        'icon-512x512.png',
        'icon-maskable-512.png',
        'apple-touch-icon.png',
        'push-sw.js',
      ],
      manifest: false,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['push-sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: [
          '**/react-pdf.browser*.js',
          '**/EventPDFDocument*.js',
          '**/vendor-charts*.js',
          '**/AI_Mentor*.js',
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              networkTimeoutSeconds: 8,
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib/useEvents': path.resolve(__dirname, './src/lib/offline/useOfflineEvents.js'),
      '@/lib/useClients': path.resolve(__dirname, './src/lib/offline/useOfflineClients.js'),
      '@/lib/useExpenses': path.resolve(__dirname, './src/lib/offline/useOfflineExpenses.js'),
      '@/lib/useDailyWork': path.resolve(__dirname, './src/lib/offline/useOfflineDailyWork.js'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    rollupOptions: {
      output: {
        // Separação por pacote exato. A forma antiga (lista de pacotes) puxava as dependências
        // junto: o "clsx" do recharts caía em vendor-charts e o login baixava os gráficos
        // inteiros (113 KB gzip) só para juntar nomes de classes CSS.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          const p = id.replace(/\\/g, '/');
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(p)) return 'vendor-react';
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(p)) return 'vendor-motion';
          if (/\/node_modules\/@supabase\//.test(p)) return 'vendor-supabase';
          // Utilitários pequenos usados pelo app inteiro E pelo recharts: pacote próprio,
          // senão o Rollup os coloca dentro de vendor-charts.
          if (/\/node_modules\/(clsx|tailwind-merge|class-variance-authority)\//.test(p)) return 'vendor-utils';
          if (/\/node_modules\/(recharts|recharts-scale|victory-vendor|d3-[^/]+|internmap|decimal\.js-light)\//.test(p)) return 'vendor-charts';
          if (/\/node_modules\/@svg-maps\/brazil\//.test(p)) return 'vendor-brazil-map';
          // Ícones num arquivo só: separados, cada ícone virava um arquivo e o celular fazia
          // dezenas de pedidos minúsculos em fila (1,6 s na abertura do Início).
          if (/\/node_modules\/lucide-react\//.test(p)) return 'vendor-icons';
          // @radix-ui fica sem grupo: cada tela baixa só os componentes que usa
          // (o login usa 1 ou 2; o grupo inteiro tinha 58 KB gzip).
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})