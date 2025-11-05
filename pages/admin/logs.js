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

function normalizeName(s) {
  try {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // remove pontuação
      .replace(/\s+/g, ' ') // espaços múltiplos
      .trim();
  } catch {
    return String(s || '').toLowerCase().trim();
  }
}

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
  const [searchCpf, setSearchCpf] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  const agentGroups = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    const map = {};
    for (const r of list) {
      const raw = r?.agente || '—';
      const key = normalizeName(raw) || '—';
      if (!map[key]) map[key] = { key, label: raw, count: 0 };
      map[key].count += 1;
      // opcional: escolha label mais "bonita" pela maior frequência
      // (mantemos primeira ocorrência para simplicidade)
    }
    return map;
  }, [requests]);

  const allAgents = useMemo(() => {
    return Object.values(agentGroups).sort((a, b) => a.label.localeCompare(b.label));
  }, [agentGroups]);

  const typeGroups = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    const map = {};
    for (const r of list) {
      const raw = r?.tipo || 'Outro';
      const key = normalizeName(raw) || 'outro';
      if (!map[key]) map[key] = { key, label: raw, count: 0 };
      map[key].count += 1;
    }
    return map;
  }, [requests]);

  const allTypes = useMemo(() => {
    return Object.values(typeGroups).sort((a, b) => a.label.localeCompare(b.label));
  }, [typeGroups]);

  const filteredRequests = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
    return list.filter((r) => {
      const agente = normalizeName(r?.agente || '—') || '—';
      const tipo = normalizeName(r?.tipo || 'Outro') || 'outro';
      const ts = r?.createdAt ? new Date(r.createdAt).getTime() : 0;
      if (selectedAgents.length && !selectedAgents.includes(agente)) return false;
      if (selectedTypes.length && !selectedTypes.includes(tipo)) return false;
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      return true;
    });
  }, [requests, selectedAgents, selectedTypes, dateFrom, dateTo]);

  const chartData = useMemo(() => {
    const list = filteredRequests;
    const byType = {};
    const byAgent = {};
    const byHour = Array.from({ length: 24 }, () => 0);
    for (const r of list) {
      const tipoKey = normalizeName(r?.tipo || 'Outro') || 'outro';
      const agentKey = normalizeName(r?.agente || '—') || '—';
      byType[tipoKey] = (byType[tipoKey] || 0) + 1;
      byAgent[agentKey] = (byAgent[agentKey] || 0) + 1;
      const h = new Date(r?.createdAt).getHours?.() ?? new Date(r?.createdAt).getHours();
      if (Number.isFinite(h) && h >= 0 && h < 24) byHour[h] += 1;
    }
    const typeEntries = Object.keys(byType).map((k) => ({ key: k, label: typeGroups[k]?.label || k, value: byType[k] }));
    const agentEntries = Object.keys(byAgent).map((k) => ({ key: k, label: agentGroups[k]?.label || k, value: byAgent[k] }));
    const typeLabels = typeEntries.map((e) => e.label);
    const typeValues = typeEntries.map((e) => e.value);
    const agentLabels = agentEntries.map((e) => e.label);
    const agentValues = agentEntries.map((e) => e.value);
    const hourLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    return {
      byType: { labels: typeLabels, datasets: [{ label: 'Solicitações por tipo', data: typeValues, backgroundColor: 'rgba(59,130,246,0.6)' }] },
      byAgent: { labels: agentLabels, datasets: [{ label: 'Solicitações por agente', data: agentValues, backgroundColor: 'rgba(34,197,94,0.6)' }] },
      byHour: { labels: hourLabels, datasets: [{ label: 'Solicitações por hora', data: byHour, borderColor: 'rgba(234,88,12,1)', backgroundColor: 'rgba(234,88,12,0.2)', pointRadius: 3, pointHoverRadius: 6 }] },
    };
  }, [filteredRequests]);

  return (
    <div className="min-h-screen container-pad py-8 max-w-6xl mx-auto">
      <h1 className="titulo-principal mb-4">Logs</h1>
      <div className="mb-3 text-sm text-black/70">{loading ? 'Atualizando…' : 'Atualizado'}</div>
      <div className="p-4 bg-white rounded border border-black/10 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Pesquisar CPF</label>
            <input value={searchCpf} onChange={(e) => setSearchCpf(e.target.value)} placeholder="Digite o CPF" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm mb-1">De (data)</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm mb-1">Até (data)</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="md:col-span-1"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <div className="text-sm mb-1">Agentes</div>
            <div className="flex flex-wrap gap-2">
              {allAgents.map((a) => (
                <label key={a.key} className="flex items-center gap-1 text-sm border rounded px-2 py-1">
                  <input type="checkbox" checked={selectedAgents.includes(a.key)} onChange={(e) => {
                    setSelectedAgents((prev) => e.target.checked ? [...prev, a.key] : prev.filter((x) => x !== a.key));
                  }} />
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm mb-1">Tipos</div>
            <div className="flex flex-wrap gap-2">
              {allTypes.map((t) => (
                <label key={t.key} className="flex items-center gap-1 text-sm border rounded px-2 py-1">
                  <input type="checkbox" checked={selectedTypes.includes(t.key)} onChange={(e) => {
                    setSelectedTypes((prev) => e.target.checked ? [...prev, t.key] : prev.filter((x) => x !== t.key));
                  }} />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-white rounded border border-black/10">
          <div className="font-medium mb-2">Solicitações por tipo</div>
          <Bar data={chartData.byType} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
        </div>
        <div className="p-4 bg-white rounded border border-black/10">
          <div className="font-medium mb-2">Solicitações por agente</div>
          <Bar data={chartData.byAgent} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
        </div>
        <div className="p-4 bg-white rounded border border-black/10 md:col-span-2">
          <div className="font-medium mb-2">Solicitações por hora</div>
          <Line data={chartData.byHour} options={{ responsive: true, interaction: { intersect: false, mode: 'nearest' }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => items.length ? `Hora ${items[0].label}:00` : '', label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
        </div>
      </div>
      {searchCpf && (
        <div className="p-4 bg-white rounded border border-black/10 mb-6">
          <div className="font-medium mb-2">Resultados para CPF: {searchCpf}</div>
          <div className="text-sm text-black/60 mb-2">{filteredRequests.filter((r) => String(r?.cpf || '').includes(searchCpf.replace(/\D/g, ''))).length} registro(s) encontrado(s)</div>
          <div className="space-y-2 max-h-72 overflow-auto">
            {filteredRequests.filter((r) => String(r?.cpf || '').includes(searchCpf.replace(/\D/g, ''))).map((r) => (
              <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.tipo} — {r.cpf}</div>
                  <div className="text-xs text-black/60">Agente: {r.agente || '—'} • Status: {r.status || '—'}</div>
                </div>
                <div className="text-xs text-black/60">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
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
