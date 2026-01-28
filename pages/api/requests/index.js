// pages/api/requests/index.js
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      error: 'DATABASE_URL não configurado',
      hint: 'Configure DATABASE_URL nas variáveis de ambiente do site (Netlify: Site settings → Environment variables).'
    });
  }

  if (req.method === 'POST') {
    try {
      const { agente, cpf, tipo, payload, agentContact, waMessageId } = req.body || {};
      const created = await prisma.request.create({
        data: {
          agente: agente ?? '',
          cpf: cpf ?? '',
          tipo: tipo ?? '',
          payload: payload ?? {},
          agentContact: agentContact ?? null,
          waMessageId: waMessageId ?? null
        }
      });
      return res.status(201).json(created);
    } catch (e) {
      console.error('[api/requests POST]', e);
      return res.status(503).json({
        error: 'Erro ao salvar no banco',
        hint: 'Verifique DATABASE_URL (Supabase/Postgres) e se as tabelas existem (npx prisma db push).'
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const list = await prisma.request.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(list);
    } catch (e) {
      console.error('[api/requests GET]', e);
      // Devolver lista vazia para o painel carregar; front pode checar _degraded
      return res.status(200).json([]);
    }
  }

  return res.status(405).end();
}
