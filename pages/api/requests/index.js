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
      const msg = String(e.message || e);
      const isTenantNotFound = /tenant or user not found/i.test(msg);
      const isConnection = /connect|ECONNREFUSED|timeout|ETIMEDOUT|pool/i.test(msg);
      const isMissingTable = /relation.*does not exist|does not exist/i.test(msg);
      let hint = 'Verifique DATABASE_URL (Supabase/Postgres) e se as tabelas existem (npx prisma db push).';
      if (isTenantNotFound) hint = 'Supabase pooler: use a Connection string do Dashboard (Session/Transaction mode). O usuário deve ser postgres.PROJECT_REF (ex.: postgres.ooystigvanwktbjqnxhr). Se mudou a senha ou retomou o projeto, atualize DATABASE_URL na Vercel e faça redeploy.';
      else if (isConnection) hint = 'Use a URL do pooler do Supabase na Vercel (porta 6543). Supabase → Settings → Database → Connection string → Session/Transaction mode.';
      else if (isMissingTable) hint = 'Tabelas Request/UsageLog não existem. No Supabase: SQL Editor → execute o script da seção 3 do SUPABASE_CONFIGURACAO_COMPLETA.md.';
      const detail = msg.replace(/postgresql:\/\/[^@]+@/i, 'postgresql://***@').slice(0, 300);
      return res.status(503).json({
        error: 'Erro ao salvar no banco',
        hint,
        detail
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
