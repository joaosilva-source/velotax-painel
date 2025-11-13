import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

// Try to load chart renderer; optional dependency in serverless
let ChartJSNodeCanvas = null;
try { ({ ChartJSNodeCanvas } = require('chartjs-node-canvas')); } catch {}

const brand = {
  bg: 'F8FAFC', // slate-50
  text: '0B1220', // near black
  primary: '0EA5E9', // sky-500
  secondary: '10B981', // emerald-500
  border: 'E5E7EB', // gray-200
};

function summarize(logs) {
  const byAction = new Map();
  const byDay = new Map();
  for (const l of logs) {
    const a = String(l.action || '—');
    byAction.set(a, (byAction.get(a) || 0) + 1);
    const day = new Date(l.createdAt).toISOString().slice(0,10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }
  const actions = Array.from(byAction.entries()).sort((a,b)=>b[1]-a[1]);
  const days = Array.from(byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  return { actions, days };
}

async function renderChartImage({ labels, data, title }) {
  if (!ChartJSNodeCanvas) return null;
  try {
    const width = 960; const height = 420;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: '#ffffff' });
    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: `rgba(14,165,233,0.8)`,
          borderColor: `#0EA5E9`,
          borderWidth: 1,
        }]
      },
      options: {
        responsive: false,
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
    const buffer = await chartJSNodeCanvas.renderToBuffer(config);
    return buffer;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const limit = Math.min(parseInt(req.query.limit || '2000', 10) || 2000, 10000);
    const rows = await prisma.usageLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });

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

    // Sheet 1: Dados
    const ws = wb.addWorksheet('Dados');
    ws.columns = [
      { header: 'Data/Hora', key: 'createdAt', width: 22 },
      { header: 'Usuário', key: 'userEmail', width: 26 },
      { header: 'Ação', key: 'action', width: 28 },
      { header: 'IP', key: 'ip', width: 18 },
      { header: 'Detalhe (JSON)', key: 'detail', width: 60 },
    ];
    ws.getRow(1).eachCell(c => { c.style = headerStyle; });
    rows.forEach(r => {
      ws.addRow({
        createdAt: new Date(r.createdAt),
        userEmail: r.userEmail || '',
        action: r.action || '',
        ip: r.ip || '',
        detail: r.detail ? JSON.stringify(r.detail) : ''
      });
    });
    ws.getColumn('createdAt').numFmt = 'dd/mm/yyyy hh:mm:ss';
    ws.eachRow((row, i) => {
      row.height = i === 1 ? 22 : 18;
    });
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    // Summaries
    const { actions, days } = summarize(rows);

    // Sheet 2: Resumos
    const ws2 = wb.addWorksheet('Resumos');
    ws2.getCell('A1').value = 'Resumo por Ação';
    ws2.getCell('A1').font = { bold: true, size: 14, color: { argb: brand.text } };
    ws2.addTable({
      name: 'ResumoAcao',
      ref: 'A2',
      headerRow: true,
      totalsRow: true,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        { name: 'Ação', totalsRowLabel: 'Total' },
        { name: 'Quantidade', totalsRowFunction: 'sum' },
      ],
      rows: actions.map(([k,v]) => [k, v])
    });

    const startChart1Row = 2 + (actions.length + 2) + 1; // after table + space

    ws2.getCell(`A${startChart1Row}`).value = 'Resumo por Dia';
    ws2.getCell(`A${startChart1Row}`).font = { bold: true, size: 14, color: { argb: brand.text } };
    ws2.addTable({
      name: 'ResumoDia',
      ref: `A${startChart1Row+1}`,
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
    const img1 = await renderChartImage({
      labels: actions.map(([k])=>k),
      data: actions.map(([,v])=>v),
      title: 'Ações (Top)'
    });
    const img2 = await renderChartImage({
      labels: days.map(([k])=>k),
      data: days.map(([,v])=>v),
      title: 'Registros por Dia'
    });

    let curRow = startChart1Row + days.length + 6;
    if (img1) {
      const id = wb.addImage({ buffer: img1, extension: 'png' });
      ws2.addImage(id, { tl: { col: 6, row: 1 }, ext: { width: 640, height: 280 } });
    }
    if (img2) {
      const id2 = wb.addImage({ buffer: img2, extension: 'png' });
      ws2.addImage(id2, { tl: { col: 6, row: curRow }, ext: { width: 640, height: 280 } });
    }

    // Prepare response
    const filename = `logs_${new Date().toISOString().slice(0,10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
