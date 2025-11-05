import { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

function formatItem(log) {
  const a = log.action;
  const d = log.detail || {};
  if (a === 'auto_status_done') {
    return { icon: '✅', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} marcado via reação` };
  }
  if (a === 'status_update') {
    const st = d.status || '';
    if (st === 'feito') return { icon: '✅', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'}` };
    if (st === 'não feito') return { icon: '❌', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'}` };
    return { icon: 'ℹ️', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} (status: ${st})` };
  }
  if (a === 'send_request') {
    return { icon: '📨', text: `${d.cpf || 'CPF'} — ${d.tipo || 'Tipo'} enviado` };
  }
  return { icon: '📝', text: a };
}

export default function AdminLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const cached = localStorage.getItem('velotax_logs');
    if (cached) {
      try { setItems(JSON.parse(cached)); } catch {}
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/logs');
        let data = [];
        try { data = await res.json(); } catch {}
        if (!Array.isArray(data)) data = [];
        setItems(data);
        try { localStorage.setItem('velotax_logs', JSON.stringify(data)); } catch {}
        try {
          const rres = await fetch('/api/requests');
          let rdata = [];
          try { rdata = await rres.json(); } catch {}
          if (!Array.isArray(rdata)) rdata = [];
          setRequests(rdata);
          try { localStorage.setItem('velotax_requests', JSON.stringify(rdata)); } catch {}
        } catch {}
      } catch {}
      setLoading(false);
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => (Array.isArray(items) ? items : []).map((l) => ({
    id: l.id,
    createdAt: new Date(l.createdAt).toLocaleString(),
    ...formatItem(l)
  })), [items]);

  const chartData = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    const byType = {};
    const byAgent = {};
    const byHour = Array.from({ length: 24 }, () => 0);
    for (const r of list) {
      const tipo = r?.tipo || 'Outro';
      const agente = r?.agente || '—';
      byType[tipo] = (byType[tipo] || 0) + 1;
      byAgent[agente] = (byAgent[agente] || 0) + 1;
      const h = new Date(r?.createdAt).getHours?.() ?? new Date(r?.createdAt).getHours();
      if (Number.isFinite(h) && h >= 0 && h < 24) byHour[h] += 1;
    }
    const typeLabels = Object.keys(byType);
    const typeValues = typeLabels.map((k) => byType[k]);
    const agentLabels = Object.keys(byAgent);
    const agentValues = agentLabels.map((k) => byAgent[k]);
    const hourLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    return {
      byType: { labels: typeLabels, datasets: [{ label: 'Solicitações por tipo', data: typeValues, backgroundColor: 'rgba(59,130,246,0.6)' }] },
      byAgent: { labels: agentLabels, datasets: [{ label: 'Solicitações por agente', data: agentValues, backgroundColor: 'rgba(34,197,94,0.6)' }] },
      byHour: { labels: hourLabels, datasets: [{ label: 'Solicitações por hora', data: byHour, borderColor: 'rgba(234,88,12,1)', backgroundColor: 'rgba(234,88,12,0.2)' }] },
    };
  }, [requests]);

  return (
    <div className="min-h-screen container-pad py-8 max-w-6xl mx-auto">
      <h1 className="titulo-principal mb-4">Logs</h1>
      <div className="mb-3 text-sm text-black/70">{loading ? 'Atualizando…' : 'Atualizado'}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-white rounded border border-black/10">
          <div className="font-medium mb-2">Solicitações por tipo</div>
          <Bar data={chartData.byType} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="p-4 bg-white rounded border border-black/10">
          <div className="font-medium mb-2">Solicitações por agente</div>
          <Bar data={chartData.byAgent} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="p-4 bg-white rounded border border-black/10 md:col-span-2">
          <div className="font-medium mb-2">Solicitações por hora</div>
          <Line data={chartData.byHour} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{r.icon}</span>
              <span>{r.text}</span>
            </div>
            <div className="text-xs text-black/60">{r.createdAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
