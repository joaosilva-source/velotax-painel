import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, descricao, pergunta, resposta, tema } = req.body || {};
    const t = String(type || '').toLowerCase();
    const desc = String(descricao || '').trim();
    if (!t || !desc) return res.status(400).json({ error: 'type e descricao são obrigatórios' });

    const entry = {
      type: t,
      descricao: desc,
      pergunta: String(pergunta || ''),
      resposta: String(resposta || ''),
      tema: String(tema || ''),
      createdAt: new Date().toISOString()
    };

    // 1) Tentar persistir localmente (ambiente dev ou file-system gravável)
    try {
      const dir = path.join(process.cwd(), 'data');
      try { fs.mkdirSync(dir, { recursive: true }); } catch {}
      const file = path.join(dir, 'feedback.json');
      let arr = [];
      try { arr = JSON.parse(fs.readFileSync(file, 'utf8') || '[]'); } catch {}
      if (!Array.isArray(arr)) arr = [];
      arr.unshift(entry);
      fs.writeFileSync(file, JSON.stringify(arr.slice(0, 500), null, 2), 'utf8');
    } catch {}

    // 2) Emitir log (quando backend com DB estiver disponível)
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'feedback', detail: entry })
      }).catch(()=>{});
    } catch {}

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true });
  }
}
