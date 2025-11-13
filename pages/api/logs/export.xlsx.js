import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

const brand = {
  bg: 'F8FAFC', // slate-50
  text: '0B1220', // near black
  primary: '0EA5E9', // sky-500
  secondary: '10B981', // emerald-500
  border: 'E5E7EB', // gray-200
};

function summarizeRequests(reqs, hourDayISO) {
  const byType = new Map();
  const byAgent = new Map();
  const byDay = new Map();
  const byHour = Array.from({ length: 24 }, () => 0);
  const singleDay = !!hourDayISO;
  for (const r of reqs) {
    const tipo = String(r?.tipo || 'Outro');
    const agente = String(r?.agente || '—');
    byType.set(tipo, (byType.get(tipo) || 0) + 1);
    byAgent.set(agente, (byAgent.get(agente) || 0) + 1);
    const day = new Date(r.createdAt).toISOString().slice(0,10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
    if (singleDay) {
      const d = new Date(r.createdAt);
      const h = d.getHours();
      if (h >= 0 && h < 24) byHour[h] += 1;
    }
  }
  const types = Array.from(byType.entries()).sort((a,b)=>b[1]-a[1]);
  const agents = Array.from(byAgent.entries()).sort((a,b)=>b[1]-a[1]);
  const days = Array.from(byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  return { types, agents, days, byHour, singleDay };
}

async function renderChartImage({ labels, data, title }) {
  try {
    const cfg = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: 'rgba(14,165,233,0.8)',
          borderColor: '#0EA5E9',
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          title: { display: true, text: title, color: '#0B1220', font: { size: 16, weight: '600' } }
        },
        scales: {
          x: { ticks: { color: '#0B1220' }, grid: { color: '#E5E7EB' } },
          y: { ticks: { color: '#0B1220' }, grid: { color: '#E5E7EB' }, beginAtZero: true }
        }
      }
    };
    const url = 'https://quickchart.io/chart';
    const params = new URLSearchParams({ c: JSON.stringify(cfg), width: '960', height: '420', backgroundColor: 'white', format: 'png' });
    const r = await fetch(`${url}?${params.toString()}`);
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return buf;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const limit = Math.min(parseInt(req.query.limit || '5000', 10) || 5000, 20000);
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom) + 'T00:00:00') : null;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo) + 'T23:59:59') : null;
    const agents = req.query.agents ? String(req.query.agents).split(',').filter(Boolean) : [];
    const types = req.query.types ? String(req.query.types).split(',').filter(Boolean) : [];
    const hourDay = req.query.hourDay ? new Date(String(req.query.hourDay)) : null;

    const where = {};
    if (dateFrom || dateTo) where.createdAt = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) };
    if (agents.length) where.agente = { in: agents };
    if (types.length) where.tipo = { in: types };

    const rows = await prisma.request.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Velotax Painel';
    wb.created = new Date();

    // Styles
    const headerStyle = {
      font: { bold: true, color: { argb: brand.text }, size: 12 },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: brand.bg } },
      border: { bottom: { style: 'thin', color: { argb: brand.border } } }
    };

    // Sheet 1: Dados (Requests filtrados)
    const ws = wb.addWorksheet('Dados');
    ws.columns = [
      { header: 'Data/Hora', key: 'createdAt', width: 22 },
      { header: 'Agente', key: 'agente', width: 26 },
      { header: 'Tipo', key: 'tipo', width: 28 },
      { header: 'CPF', key: 'cpf', width: 20 },
      { header: 'Payload (JSON)', key: 'payload', width: 60 },
    ];
    ws.getRow(1).eachCell(c => { c.style = headerStyle; });
    rows.forEach(r => {
      ws.addRow({
        createdAt: new Date(r.createdAt),
        agente: r.agente || '',
        tipo: r.tipo || '',
        cpf: r.cpf || '',
        payload: r.payload ? JSON.stringify(r.payload) : ''
      });
    });
    ws.getColumn('createdAt').numFmt = 'dd/mm/yyyy hh:mm:ss';
    ws.eachRow((row, i) => {
      row.height = i === 1 ? 22 : 18;
    });
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    // Summaries (por tipo, agente, dia e opcionalmente hora)
    const isoDay = hourDay ? new Date(hourDay.getFullYear(), hourDay.getMonth(), hourDay.getDate()).toISOString().slice(0,10) : (dateFrom && dateTo && dateFrom.toDateString() === dateTo.toDateString() ? dateFrom.toISOString().slice(0,10) : null);
    const { types: sumTypes, agents: sumAgents, days, byHour, singleDay } = summarizeRequests(rows, isoDay);

    // Sheet 2: Resumos
    const ws2 = wb.addWorksheet('Resumos');
    ws2.getCell('A1').value = 'Solicitações por Tipo';
    ws2.getCell('A1').font = { bold: true, size: 14, color: { argb: brand.text } };
    ws2.addTable({
      name: 'ResumoTipo',
      ref: 'A2',
      headerRow: true,
      totalsRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: 'Tipo', totalsRowLabel: 'Total' },
        { name: 'Quantidade', totalsRowFunction: 'sum' },
      ],
      rows: sumTypes.map(([k,v]) => [k, v])
    });

    const startChart1Row = 2 + (sumTypes.length + 2) + 1; // after table + space

    ws2.getCell(`A${startChart1Row}`).value = 'Solicitações por Agente';
    ws2.getCell(`A${startChart1Row}`).font = { bold: true, size: 14, color: { argb: brand.text } };
    ws2.addTable({
      name: 'ResumoAgente',
      ref: `A${startChart1Row+1}`,
      headerRow: true,
      totalsRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: 'Agente', totalsRowLabel: 'Total' },
        { name: 'Quantidade', totalsRowFunction: 'sum' },
      ],
      rows: sumAgents.map(([k,v]) => [k, v])
    });

    const startChart2Row = startChart1Row + (sumAgents.length + 2) + 2;

    ws2.getCell(`A${startChart2Row}`).value = 'Solicitações por Dia';
    ws2.getCell(`A${startChart2Row}`).font = { bold: true, size: 14, color: { argb: brand.text } };
    ws2.addTable({
      name: 'ResumoDia',
      ref: `A${startChart2Row+1}`,
      headerRow: true,
      totalsRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: 'Dia', totalsRowLabel: 'Total' },
        { name: 'Quantidade', totalsRowFunction: 'sum' },
      ],
      rows: days.map(([k,v]) => [k, v])
    });

    // Render charts as images and embed
    const imgType = await renderChartImage({
      labels: sumTypes.map(([k])=>k),
      data: sumTypes.map(([,v])=>v),
      title: 'Solicitações por Tipo'
    });
    const imgAgent = await renderChartImage({
      labels: sumAgents.map(([k])=>k),
      data: sumAgents.map(([,v])=>v),
      title: 'Solicitações por Agente'
    });
    const imgDay = await renderChartImage({
      labels: days.map(([k])=>k),
      data: days.map(([,v])=>v),
      title: 'Solicitações por Dia'
    });
    let imgHour = null;
    if (singleDay) {
      const hourLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
      const title = hourDay ? `Solicitações por Hora (${hourDay.toLocaleDateString('pt-BR')})` : 'Solicitações por Hora (Dia)';
      imgHour = await renderChartImage({ labels: hourLabels, data: byHour, title });
    }

    let curRow = 1;
    if (imgType) {
      const id = wb.addImage({ buffer: imgType, extension: 'png' });
      ws2.addImage(id, { tl: { col: 6, row: curRow }, ext: { width: 640, height: 280 } });
      curRow += 18;
    }
    if (imgAgent) {
      const id2 = wb.addImage({ buffer: imgAgent, extension: 'png' });
      ws2.addImage(id2, { tl: { col: 6, row: curRow }, ext: { width: 640, height: 280 } });
      curRow += 18;
    }
    if (imgDay) {
      const id3 = wb.addImage({ buffer: imgDay, extension: 'png' });
      ws2.addImage(id3, { tl: { col: 6, row: curRow }, ext: { width: 640, height: 280 } });
      curRow += 18;
    }
    if (imgHour) {
      const id4 = wb.addImage({ buffer: imgHour, extension: 'png' });
      ws2.addImage(id4, { tl: { col: 6, row: curRow }, ext: { width: 640, height: 280 } });
    }

    // Prepare response
    const filename = `relatorio_${new Date().toISOString().slice(0,10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
