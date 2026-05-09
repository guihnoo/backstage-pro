/**
 * API Backstage Pro — ponto de entrada mínimo (Fastify).
 * Produção: definir FRONTEND_ORIGIN com o URL exato do PWA (HTTPS).
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const fastify = Fastify({
  logger: process.env.NODE_ENV === 'production'
    ? true
    : { level: 'info' },
});

await fastify.register(cors, {
  origin: FRONTEND_ORIGIN.includes(',')
    ? FRONTEND_ORIGIN.split(',').map((s) => s.trim())
    : FRONTEND_ORIGIN,
  credentials: true,
});

fastify.get('/api/health', async () => ({
  ok: true,
  service: 'backstage-pro-api',
  ts: new Date().toISOString(),
}));

await fastify.listen({ port: PORT, host: HOST });
console.log(`API listening on http://${HOST}:${PORT}`);
