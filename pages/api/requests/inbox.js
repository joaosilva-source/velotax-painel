import { replies } from '../../../lib/store';

export default function handler(req, res) {
  const { agent } = req.query || {};
  const out = replies.filter((r) => !agent || (r.agent && r.agent === agent));
  res.status(200).json({ ok: true, items: out.slice(-50).reverse() });
}


