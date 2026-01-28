// pages/api/logs/index.js
import prisma from '@/lib/prisma';

// in-memory cache (per server instance)
let cache = { data: null, ts: 0 };
const CACHE_MS = 10 * 1000; // 10s, evitar defasagem

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    if (req.method === 'GET') return res.status(200).json([]);
    return res.status(503).json({
      error: 'DATABASE_URL não configurado',
      hint: 'Configure DATABASE_URL nas variáveis de ambiente (Netlify: Site settings → Environment variables).'
    });
  }

  if (req.method === 'POST') {
    try {
      const { userEmail, action, detail, ip } = req.body || {};
      const created = await prisma.usageLog.create({
        data: { userEmail: userEmail || null, action, detail: detail || null, ip: ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress }
      });
      // invalidate cache
      cache = { data: null, ts: 0 };
      return res.status(201).json(created);
    } catch (e) {
      console.error('[api/logs POST]', e);
      return res.status(503).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const now = Date.now();
      const noCache = String(req.query?.nocache || '').trim() === '1';
      if (!noCache && cache.data && now - cache.ts < CACHE_MS) {
        return res.json(cache.data);
      }
      let limit = parseInt(String(req.query?.limit || '1000'), 10);
      if (!Number.isFinite(limit)) limit = 1000;
      limit = Math.max(50, Math.min(5000, limit));
      const list = await prisma.usageLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
      if (!noCache) cache = { data: list, ts: now };
      return res.json(list);
    } catch (e) {
      console.error('[api/logs GET]', e);
      return res.status(200).json([]);
    }
  }

  return res.status(405).end();
}
