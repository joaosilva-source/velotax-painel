export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { waMessageId, reactor, text } = req.body || {};
    if (!waMessageId) return res.status(400).json({ ok: false, error: 'waMessageId ausente' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
