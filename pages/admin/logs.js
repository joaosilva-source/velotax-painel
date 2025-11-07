import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
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

// Carregar componentes de gráfico apenas no cliente
const Bar = dynamic(() => import('react-chartjs-2').then((m) => m.Bar), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then((m) => m.Line), { ssr: false });

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

// Unificação de tipos (ex.: "exclui de conta" -> "Exclusão de Conta")
function canonicalizeTypeKey(raw) {
  const norm = normalizeName(raw || 'outro') || 'outro';
  if ((norm.includes('exclui') || norm.includes('excluir') || norm.includes('exclusao')) && norm.includes('conta')) {
    return 'exclusao de conta';
  }
  return norm;
}

function canonicalizeTypeLabel(raw) {
  const norm = normalizeName(raw || 'outro') || 'outro';
  if ((norm.includes('exclui') || norm.includes('excluir') || norm.includes('exclusao')) && norm.includes('conta')) {
    return 'Exclusão de Conta';
  }
  return raw || 'Outro';
}

function isTestString(s) {
  const v = String(s || '').toLowerCase();
  return v.includes('teste') || v.includes('test') || v.includes('debug') || v.includes('check') || v.includes('sqse') || v.includes('sqsa');
}

function isTestRequest(r) {
  return isTestString(r?.tipo) || isTestString(r?.agente) || isTestString(r?.payload?.descricao);
}

// Unificação de nomes semelhantes, exceto Laura (separa por duas primeiras palavras)
function canonicalizeAgentKey(raw) {
  const norm = normalizeName(raw || '—') || '—';
  const parts = norm.split(' ').filter(Boolean);
  if (parts[0] === 'laura') {
    const second = parts[1] || '';
    if (second === 'g' || second === 'guedes') return 'laura guedes';
    return parts.slice(0, 2).join(' ') || 'laura';
  }
  // Demais nomes: usar apenas primeiro token para agrupar variações (ex.: "joao", "joao s")
  return parts[0] || norm;
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
  const [chartsReady, setChartsReady] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [searchCpf, setSearchCpf] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hourDay, setHourDay] = useState(''); // seletor do dia para gráfico por hora

  // Helpers: chips rápidos de período
  const dateToInputStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const setQuickRange = (key) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (key === 'today') {
      const s = dateToInputStr(today);
      setDateFrom(s); setDateTo(s);
      return;
    }
    if (key === 'week') {
      const day = today.getDay(); // 0=Dom, 1=Seg
      const diffToMonday = (day + 6) % 7; // transforma: Seg=0, Dom=6
      const monday = new Date(today); monday.setDate(today.getDate() - diffToMonday);
      setDateFrom(dateToInputStr(monday)); setDateTo(dateToInputStr(today));
      return;
    }
    if (key === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(dateToInputStr(first)); setDateTo(dateToInputStr(today));
      return;
    }
  };

  useEffect(() => {
    // Registrar ChartJS somente no cliente para evitar divergência de hidratação
    try {
      ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);
    } catch {}
    setChartsReady(true);
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

  const rows = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list
      .filter((l) => {
        const d = l?.detail || {};
        // remover eventos de teste visuais
        return !(isTestString(d?.tipo) || isTestString(d?.agente));
      })
      .map((l) => ({
        id: l.id,
        createdAt: new Date(l.createdAt).toLocaleString(),
        ...formatItem(l)
      }));
  }, [items]);

  const agentGroups = useMemo(() => {
    const list = (Array.isArray(requests) ? requests : []).filter((r) => !isTestRequest(r));
    const map = {};
    for (const r of list) {
      const raw = r?.agente || '—';
      const key = canonicalizeAgentKey(raw) || '—';
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
    const list = (Array.isArray(requests) ? requests : []).filter((r) => !isTestRequest(r));
    const map = {};
    for (const r of list) {
      const raw = r?.tipo || 'Outro';
      const key = canonicalizeTypeKey(raw) || 'outro';
      const label = canonicalizeTypeLabel(raw);
      if (!map[key]) map[key] = { key, label, count: 0 };
      map[key].count += 1;
    }
    return map;
  }, [requests]);

  const allTypes = useMemo(() => {
    return Object.values(typeGroups).sort((a, b) => a.label.localeCompare(b.label));
  }, [typeGroups]);

  const filteredRequests = useMemo(() => {
    const list = (Array.isArray(requests) ? requests : []).filter((r) => !isTestRequest(r));
    const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
    return list.filter((r) => {
      const agente = canonicalizeAgentKey(r?.agente || '—') || '—';
      const tipo = canonicalizeTypeKey(r?.tipo || 'Outro') || 'outro';
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
    // filtrar por dia específico para o gráfico por hora, se selecionado
    const dayStr = hourDay ? new Date(hourDay).toDateString() : null;
    const listForHour = dayStr ? list.filter((r) => new Date(r?.createdAt || 0).toDateString() === dayStr) : list;
    const byType = {};
    const byAgent = {};
    const byHour = Array.from({ length: 24 }, () => 0);
    for (const r of list) {
      const tipoKey = canonicalizeTypeKey(r?.tipo || 'Outro') || 'outro';
      const agentKey = canonicalizeAgentKey(r?.agente || '—') || '—';
      byType[tipoKey] = (byType[tipoKey] || 0) + 1;
      byAgent[agentKey] = (byAgent[agentKey] || 0) + 1;
    }
    for (const r of listForHour) {
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
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-sm text-black/60">Período rápido:</span>
          <button type="button" onClick={() => setQuickRange('today')} className="text-xs px-2 py-1 rounded border hover:opacity-90">Hoje</button>
          <button type="button" onClick={() => setQuickRange('week')} className="text-xs px-2 py-1 rounded border hover:opacity-90">Semana</button>
          <button type="button" onClick={() => setQuickRange('month')} className="text-xs px-2 py-1 rounded border hover:opacity-90">Mês</button>
          {(dateFrom || dateTo) && (
            <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }} className="ml-2 text-xs px-2 py-1 rounded border hover:opacity-90">Limpar</button>
          )}
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
          {chartsReady && (
            <Bar data={chartData.byType} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
          )}
        </div>
        <div className="p-4 bg-white rounded border border-black/10">
          <div className="font-medium mb-2">Solicitações por agente</div>
          {chartsReady && (
            <Bar data={chartData.byAgent} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
          )}
        </div>
        <div className="p-4 bg-white rounded border border-black/10 md:col-span-2">
          <div className="font-medium mb-2 flex items-center justify-between gap-3">
            <span>Solicitações por hora</span>
            <div className="flex items-center gap-2 text-sm">
              <label className="opacity-80">Dia:</label>
              <input type="date" value={hourDay} onChange={(e)=>setHourDay(e.target.value)} className="border rounded px-2 py-1" />
              {hourDay && (
                <button type="button" onClick={()=>setHourDay('')} className="text-xs px-2 py-1 rounded border">Limpar</button>
              )}
            </div>
          </div>
          {chartsReady && (
            <Line data={chartData.byHour} options={{ responsive: true, interaction: { intersect: false, mode: 'nearest' }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => items.length ? `Hora ${items[0].label}:00` : '', label: (ctx) => `${ctx.parsed.y} solicitações` } } } }} />
          )}
        </div>
      </div>

      {loading && (
        <div className="mb-6 space-y-2">
          <div className="h-3 rounded bg-black/10 animate-pulse" />
          <div className="h-3 rounded bg-black/10 animate-pulse w-2/3" />
          <div className="h-3 rounded bg-black/10 animate-pulse w-1/3" />
        </div>
      )}
      {searchCpf && (
        <div className="p-4 bg-white rounded border border-black/10 mb-6">
          <div className="font-medium mb-2">Resultados para CPF: {searchCpf}</div>
          <div className="text-sm text-black/60 mb-2">{filteredRequests.filter((r) => !isTestRequest(r) && String(r?.cpf || '').includes(searchCpf.replace(/\D/g, ''))).length} registro(s) encontrado(s)</div>
          <div className="space-y-2 max-h-72 overflow-auto">
            {filteredRequests.filter((r) => !isTestRequest(r) && String(r?.cpf || '').includes(searchCpf.replace(/\D/g, ''))).map((r) => (
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
