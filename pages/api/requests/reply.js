import { messages, replies } from '../../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { waMessageId, reactor, text } = req.body || {};
    if (!waMessageId || !text) return res.status(400).json({ error: 'Parâmetros inválidos' });
    const meta = messages.get(waMessageId);
    const entry = {
      messageId: waMessageId,
      agent: meta?.agent || null,
      reactor: reactor || '',
      text,
      time: new Date().toLocaleString('pt-BR')
    };
    replies.push(entry);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


