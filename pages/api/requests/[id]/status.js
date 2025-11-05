// pages/api/requests/[id]/status.js
import prisma from '@/lib/prisma';

async function notifyWhatsapp({ text, toJid }) {
  const api = process.env.BACKEND_API_URL;
  if (!api || !toJid) return;
  try {
    await fetch(`${api}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid: toJid, mensagem: text })
    });
  } catch {}
}

async function notifyGoogleChat({ cardText }) {
  const hook = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!hook) return;
  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ text: cardText })
    });
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.query;
  const { status, respondedBy } = req.body || {};
  if (!id || !status) return res.status(400).json({ error: 'id e status são obrigatórios' });

  try {
    const updated = await prisma.request.update({
      where: { id },
      data: { status, respondedAt: new Date(), respondedBy: respondedBy || null }
    });

    const msg = `Atualização da solicitação ${id}\nAgente: ${updated.agente}\nCPF: ${updated.cpf}\nTipo: ${updated.tipo}\nStatus: ${status}`;

    const tasks = [
      notifyGoogleChat({ cardText: msg })
    ];
    if (process.env.WHATSAPP_STATUS_UPDATE_ENABLED === 'true') {
      tasks.push(
        notifyWhatsapp({ text: msg, toJid: updated.agentContact || process.env.NEXT_PUBLIC_DEFAULT_JID })
      );
    }
    await Promise.all(tasks);

    // logar evento de atualização de status
    try {
      await prisma.usageLog.create({
        data: {
          action: 'status_update',
          detail: { id: updated.id, cpf: updated.cpf, tipo: updated.tipo, status },
        }
      });
    } catch {}

    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
