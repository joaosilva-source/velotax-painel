import { messages } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { agente, cpf, mensagem, jid } = req.body || {};
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    if (!apiBase) return res.status(500).json({ error: 'Backend API URL not configured' });
    const resp = await fetch(`${apiBase}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid, mensagem })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.ok) {
      return res.status(resp.status || 500).json({ error: data?.error || 'Falha no envio' });
    }
    const messageId = data.messageId || null;
    if (messageId && agente) {
      messages.set(messageId, { agent: agente, cpf: cpf || '', createdAt: Date.now() });
    }
    return res.status(200).json({ ok: true, messageId, messageIds: data.messageIds || [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


