// pages/api/requests/auto-status.js
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { waMessageId, reactor, status } = req.body || {};
  if (!waMessageId || !status) return res.status(400).json({ error: 'waMessageId e status são obrigatórios' });

  const authorized = (process.env.AUTHORIZED_REACTION_NUMBER || '').replace(/\D/g, '');
  const reactorDigits = String(reactor || '').replace(/\D/g, '');
  if (authorized && authorized !== reactorDigits) {
    return res.status(403).json({ error: 'não autorizado' });
  }

  try {
    const reqRow = await prisma.request.findFirst({ where: { waMessageId } });
    if (!reqRow) return res.status(404).json({ error: 'request não encontrado' });

    const updated = await prisma.request.update({
      where: { id: reqRow.id },
      data: { status, respondedAt: new Date(), respondedBy: reactor || null }
    });

    // logar evento de auto status (reação ✅)
    try {
      await prisma.usageLog.create({
        data: {
          action: 'auto_status_done',
          detail: { id: updated.id, cpf: updated.cpf, tipo: updated.tipo, waMessageId },
        }
      });
    } catch {}

    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
