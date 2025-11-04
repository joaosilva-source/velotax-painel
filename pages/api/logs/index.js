// pages/api/logs/index.js
import prisma from '@/lib/prisma';

// in-memory cache (per server instance)
let cache = { data: null, ts: 0 };
const CACHE_MS = 30 * 1000; // 30s

export default async function handler(req, res) {
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
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const now = Date.now();
      if (cache.data && now - cache.ts < CACHE_MS) {
        return res.json(cache.data);
      }
      const list = await prisma.usageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
      cache = { data: list, ts: now };
      return res.json(cache.data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
