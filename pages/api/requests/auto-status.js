// pages/api/requests/auto-status.js
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { waMessageId, reactor, status: inputStatus, reaction } = req.body || {};
  if (!waMessageId) return res.status(400).json({ error: 'waMessageId é obrigatório' });

  // Se não vier status explícito, inferir pela reação
  let status = inputStatus;
  if (!status && reaction) {
    if (reaction === '✅') status = 'feito';
    if (reaction === '❌' || reaction === '✖️' || reaction === '✖') status = 'não feito';
  }
  if (!status) return res.status(400).json({ error: 'status ou reaction são obrigatórios' });

  // Temporariamente aceitando todas as reações para destravar o fluxo end-to-end
  // const authorized = (process.env.AUTHORIZED_REACTION_NUMBER || '').replace(/\D/g, '');
  // const reactorDigits = String(reactor || '').replace(/\D/g, '');
  // if (authorized && authorized !== reactorDigits) {
  //   return res.status(403).json({ error: 'não autorizado' });
  // }

  try {
    let reqRow = await prisma.request.findFirst({ where: { waMessageId } });
    if (!reqRow) {
      const recent = await prisma.request.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      for (const r of recent) {
        const ids = Array.isArray(r?.payload?.messageIds) ? r.payload.messageIds : [];
        if (ids.includes(waMessageId)) { reqRow = r; break; }
      }
    }
    if (!reqRow) return res.status(404).json({ error: 'request não encontrado' });

    const updated = await prisma.request.update({
      where: { id: reqRow.id },
      data: { status, respondedAt: new Date(), respondedBy: reactor || null }
    });

    // logar evento de auto status
    try {
      await prisma.usageLog.create({
        data: {
          action: status === 'feito' ? 'auto_status_done' : (status === 'não feito' ? 'auto_status_not_done' : 'auto_status_other'),
          detail: { id: updated.id, cpf: updated.cpf, tipo: updated.tipo, waMessageId, status },
        }
      });
    } catch {}

    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
