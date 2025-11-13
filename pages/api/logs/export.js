import prisma from '@/lib/prisma';

function toCSV(rows) {
  const headers = ['createdAt','userEmail','action','ip','detail'];
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    if (/[",\n;]/.test(s)) return '"' + s + '"';
    return s;
  };
  const headerLine = headers.join(',');
  const lines = rows.map(r => {
    const detailStr = r.detail ? JSON.stringify(r.detail) : '';
    const created = new Date(r.createdAt).toLocaleString('pt-BR');
    const ip = r.ip || '';
    return [created, r.userEmail || '', r.action || '', ip, detailStr].map(esc).join(',');
  });
  return [headerLine, ...lines].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const limit = Math.min(parseInt(req.query.limit || '1000', 10) || 1000, 5000);
    const list = await prisma.usageLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });

    // default CSV export
    const csv = toCSV(list);
    const filename = `logs_${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send('\uFEFF' + csv); // BOM for Excel compatibility
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
