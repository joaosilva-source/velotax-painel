// pages/api/requests/reply.js
// Persiste respostas no grupo (menção/reply à mensagem da solicitação) no mesmo Request.
// Chamado pela API WhatsApp quando alguém responde à mensagem da solicitação no grupo.

import prisma from '@/lib/prisma';

function ensureRepliesArray(replies) {
  if (Array.isArray(replies)) return replies;
  if (replies && typeof replies === 'object' && !Array.isArray(replies)) return [];
  return [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok: false, error: 'DATABASE_URL não configurado' });
  }

  const { waMessageId, reactor, text } = req.body || {};
  if (!waMessageId) return res.status(400).json({ ok: false, error: 'waMessageId é obrigatório' });
  const textStr = text != null ? String(text).trim() : '';
  if (!textStr) return res.status(400).json({ ok: false, error: 'text é obrigatório' });

  try {
    let reqRow = await prisma.request.findFirst({ where: { waMessageId } });
    if (!reqRow) {
      const recent = await prisma.request.findMany({
        orderBy: { createdAt: 'desc' },
        take: 80
      });
      for (const r of recent) {
        const ids = Array.isArray(r?.payload?.messageIds) ? r.payload.messageIds : [];
        if (ids.includes(waMessageId)) {
          reqRow = r;
          break;
        }
      }
    }

    if (!reqRow) {
      return res.status(200).json({ ok: true, saved: false, reason: 'request não encontrado' });
    }

    const existingReplies = ensureRepliesArray(reqRow.replies);
    const newEntry = {
      reactor: reactor != null ? String(reactor) : '',
      text: textStr,
      at: new Date().toISOString()
    };
    const nextReplies = [...existingReplies, newEntry];

    await prisma.request.update({
      where: { id: reqRow.id },
      data: { replies: nextReplies }
    });

    return res.json({ ok: true, saved: true });
  } catch (e) {
    console.error('[api/requests/reply]', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
