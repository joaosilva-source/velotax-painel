// pages/api/requests/index.js
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { agente, cpf, tipo, payload, agentContact, waMessageId } = req.body || {};
      const created = await prisma.request.create({
        data: { agente, cpf, tipo, payload, agentContact, waMessageId }
      });
      return res.status(201).json(created);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const list = await prisma.request.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(list);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
