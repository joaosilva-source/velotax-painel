// pages/api/atendimento-logs.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const logPath = path.join(process.cwd(), 'data', 'atendimento_logs.json');
    let arr = [];
    try { if (fs.existsSync(logPath)) arr = JSON.parse(fs.readFileSync(logPath, 'utf8')||'[]'); } catch {}

    // filtros simples
    const q = String(req.query.q || '').trim().toLowerCase();
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');
    const limit = Math.max(1, Math.min(2000, parseInt(String(req.query.limit||'500'),10) || 500));

    let list = Array.isArray(arr) ? arr : [];
    if (q) {
      list = list.filter(it => {
        const p = String(it.pergunta||'').toLowerCase();
        const r = String(it.resposta||'').toLowerCase();
        const f = String(it.fonte||'').toLowerCase();
        return p.includes(q) || r.includes(q) || f.includes(q);
      });
    }
    if (from) {
      const ts = new Date(from + 'T00:00:00').getTime();
      if (Number.isFinite(ts)) list = list.filter(it => Number(it.at||0) >= ts);
    }
    if (to) {
      const ts = new Date(to + 'T23:59:59').getTime();
      if (Number.isFinite(ts)) list = list.filter(it => Number(it.at||0) <= ts);
    }

    list = list.slice(0, limit);

    // CSV export
    if (String(req.query.format||'').toLowerCase() === 'csv') {
      const header = ['at','pergunta','resposta','fonte','tipo'];
      const lines = [header.join(',')];
      for (const it of list) {
        const row = header.map(k => {
          const val = String(it[k] ?? '');
          const safe = '"' + val.replace(/"/g,'""') + '"';
          return safe;
        });
        lines.push(row.join(','));
      }
      const csv = lines.join('\n');
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      res.setHeader('Content-Disposition','attachment; filename="atendimento-logs.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json(list);
  } catch (e) {
    return res.status(200).json([]);
  }
}
