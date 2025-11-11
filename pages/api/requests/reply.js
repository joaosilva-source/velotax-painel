import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { waMessageId, reactor, text } = req.body || {};
  if (!waMessageId || !text) {
    return res.status(400).json({ error: 'waMessageId e texto são obrigatórios' });
  }

  try {
    let requestRow = await prisma.request.findFirst({ where: { waMessageId } });

    if (!requestRow) {
      const recent = await prisma.request.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      for (const r of recent) {
        const ids = Array.isArray(r?.payload?.messageIds) ? r.payload.messageIds : [];
        if (ids.includes(waMessageId)) {
          requestRow = r;
          break;
        }
      }
    }

    if (!requestRow) {
      return res.status(404).json({ error: 'request não encontrado' });
    }

    const replies = Array.isArray(requestRow.payload?.replies)
      ? requestRow.payload.replies
      : [];

    const newReply = {
      text,
      reactor: reactor || null,
      at: new Date().toISOString(),
      waMessageId
    };

    const updated = await prisma.request.update({
      where: { id: requestRow.id },
      data: {
        payload: {
          ...requestRow.payload,
          replies: [...replies, newReply]
        }
      }
    });

    try {
      await prisma.usageLog.create({
        data: {
          action: 'reply_received',
          detail: { requestId: requestRow.id, reactor, text },
        }
      });
    } catch {}

    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


