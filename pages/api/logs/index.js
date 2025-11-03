// pages/api/logs/index.js
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { userEmail, action, detail, ip } = req.body || {};
      const created = await prisma.usageLog.create({
        data: { userEmail: userEmail || null, action, detail: detail || null, ip: ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress }
      });
      return res.status(201).json(created);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const list = await prisma.usageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
      return res.json(list);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
