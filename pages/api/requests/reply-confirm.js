// pages/api/requests/reply-confirm.js
// Check inverso: agente confirma que viu a resposta → reação ✓ na mensagem no WhatsApp.

import prisma from '@/lib/prisma';

const DEFAULT_API_URL = 'https://whatsapp-api-new-54aw.onrender.com';

function ensureRepliesArray(replies) {
  if (Array.isArray(replies)) return replies;
  if (replies && typeof replies === 'object' && !Array.isArray(replies)) return [];
  return [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { requestId, replyMessageId, confirmedBy } = req.body || {};
  if (!requestId || !replyMessageId) {
    return res.status(400).json({ ok: false, error: 'requestId e replyMessageId são obrigatórios' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok: false, error: 'DATABASE_URL não configurado' });
  }

  try {
    const reqRow = await prisma.request.findUnique({ where: { id: requestId } });
    if (!reqRow) return res.status(404).json({ ok: false, error: 'Solicitação não encontrada' });

    const replies = ensureRepliesArray(reqRow.replies);
    const idx = replies.findIndex((r) => String(r?.replyMessageId || '') === String(replyMessageId));
    if (idx === -1) {
      return res.status(404).json({ ok: false, error: 'Resposta não encontrada ou sem replyMessageId' });
    }

    const reply = replies[idx];
    const jid = reply?.replyMessageJid || null;
    if (!jid) {
      return res.status(400).json({ ok: false, error: 'Resposta sem jid do grupo (replyMessageJid)' });
    }
    const participant = reply?.replyMessageParticipant || null;

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
    const reactHeaders = { 'Content-Type': 'application/json' };
    if (apiUrl.includes('ngrok')) reactHeaders['ngrok-skip-browser-warning'] = 'true';
    const reactRes = await fetch(`${apiUrl}/react`, {
      method: 'POST',
      headers: reactHeaders,
      body: JSON.stringify({ messageId: replyMessageId, jid, participant })
    });
    if (!reactRes.ok) {
      const errText = await reactRes.text();
      console.error('[reply-confirm] React API error', reactRes.status, errText);
      return res.status(502).json({ ok: false, error: 'Falha ao enviar reação no WhatsApp' });
    }

    const updatedReplies = [...replies];
    updatedReplies[idx] = {
      ...reply,
      confirmedBy: confirmedBy != null ? String(confirmedBy) : (reply.confirmedBy || ''),
      confirmedAt: new Date().toISOString()
    };

    await prisma.request.update({
      where: { id: requestId },
      data: { replies: updatedReplies }
    });

    return res.json({ ok: true, confirmedAt: updatedReplies[idx].confirmedAt });
  } catch (e) {
    console.error('[api/requests/reply-confirm]', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
