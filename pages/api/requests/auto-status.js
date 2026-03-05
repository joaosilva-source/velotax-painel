// pages/api/requests/auto-status.js
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const noDb = !process.env.DATABASE_URL;
  if (noDb) {
    const { waMessageId, reaction } = req.body || {};
    const status = reaction === '✅' ? 'feito' : reaction === '❌' || reaction === '✖️' || reaction === '✖' ? 'não feito' : 'em aberto';
    console.warn('[api/requests/auto-status] Sem DATABASE_URL: reação aceita, não persistida.', { waMessageId, status });
    return res.status(200).json({ success: true, noPersist: true, status, message: 'Sem banco: reação aceita, não persistida.' });
  }

  const { waMessageId: rawWaMessageId, reactor, status: inputStatus, reaction } = req.body || {};
  const waMessageId = (typeof rawWaMessageId === 'object' && rawWaMessageId !== null)
    ? (rawWaMessageId.id || rawWaMessageId)
    : String(rawWaMessageId || '');
  if (!waMessageId) return res.status(400).json({ error: 'waMessageId é obrigatório' });

  // Se não vier status explícito, inferir pela reação
  let status = inputStatus;
  if (!status && reaction) {
    if (reaction === '✅') status = 'feito';
    if (reaction === '❌' || reaction === '✖️' || reaction === '✖') status = 'não feito';
  }
  if (!status) return res.status(400).json({ error: 'status ou reaction são obrigatórios' });

  const normId = (id) => (typeof id === 'object' && id != null ? id.id || id : String(id || '')).trim();
  const reactorDigits = String(reactor ?? '').replace(/\D/g, '');
  const allowedList = (process.env.AUTHORIZED_REACTORS || process.env.AUTHORIZED_REACTION_NUMBER || '')
    .split(',')
    .map((s) => s.replace(/\D/g, ''))
    .filter(Boolean);
  if (allowedList.length > 0 && reactorDigits && !allowedList.includes(reactorDigits)) {
    console.warn('[api/requests/auto-status] reactor não autorizado:', reactorDigits, '| permitidos:', allowedList.join(', '));
    try {
      await prisma.usageLog.create({
        data: {
          action: 'auto_status_skipped_reactor_not_authorized',
          detail: { waMessageId: normId(waMessageId), reactor: reactorDigits, allowedCount: allowedList.length }
        }
      });
    } catch {}
    return res.status(200).json({
      success: false,
      skipped: true,
      reason: 'reactor_not_authorized',
      message: 'Número que reagiu não está na lista de autorizados. Automação ignorada.'
    });
  }

  const searchId = normId(waMessageId);

  try {
    let reqRow = await prisma.request.findFirst({ where: { waMessageId: searchId } });
    if (!reqRow) {
      const recent = await prisma.request.findMany({
        orderBy: { createdAt: 'desc' },
        take: 80
      });
      for (const r of recent) {
        const ids = Array.isArray(r?.payload?.messageIds) ? r.payload.messageIds : [];
        const match = ids.some((id) => normId(id) === searchId);
        if (!match && r?.waMessageId) {
          if (normId(r.waMessageId) === searchId) { reqRow = r; break; }
        }
        if (match) { reqRow = r; break; }
      }
    }
    if (!reqRow) {
      // Solicitação não foi salva no painel (ex.: POST /api/requests falhou), mas a reação chegou.
      // Registrar no log e criar request sintético para o feito/não feito aparecer no painel.
      console.warn('[api/requests/auto-status] request não encontrado para waMessageId:', searchId, '- criando registro de reação');
      try {
        await prisma.usageLog.create({
          data: {
            action: status === 'feito' ? 'auto_status_done_no_request' : 'auto_status_not_done_no_request',
            detail: { waMessageId: searchId, status, reactor }
          }
        });
      } catch {}
      const synthetic = await prisma.request.create({
        data: {
          agente: '',
          cpf: '-',
          tipo: 'Reação (solicitação não salva no painel)',
          payload: { messageIds: [searchId], _synthetic: true },
          waMessageId: searchId,
          status,
          respondedAt: new Date(),
          respondedBy: reactor || null
        }
      });
      try {
        await prisma.usageLog.create({
          data: {
            action: status === 'feito' ? 'auto_status_done' : (status === 'não feito' ? 'auto_status_not_done' : 'auto_status_other'),
            detail: { id: synthetic.id, cpf: synthetic.cpf, tipo: synthetic.tipo, waMessageId: searchId, status }
          }
        });
      } catch {}
      return res.json({ success: true, synthetic: true, ...synthetic });
    }

    if (!reqRow.waMessageId) {
      await prisma.request.update({
        where: { id: reqRow.id },
        data: { waMessageId: searchId }
      });
    }

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

    return res.json({ success: true, ...updated });
  } catch (e) {
    console.error('[api/requests/auto-status]', e);
    // Modo degradado: em vez de 503, retorna 200 para o fluxo não quebrar; reação não é persistida.
    const status = (req.body?.reaction === '✅') ? 'feito' : (req.body?.reaction === '❌' || req.body?.reaction === '✖️' || req.body?.reaction === '✖') ? 'não feito' : 'em aberto';
    return res.status(200).json({
      success: true,
      noPersist: true,
      status,
      message: 'Banco indisponível: reação aceita, não persistida. Configure DATABASE_URL (Supabase) para persistir.'
    });
  }
}
