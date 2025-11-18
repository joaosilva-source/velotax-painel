import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';

export default function AtendimentoLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      params.set('limit','1000');
      const res = await fetch(`/api/atendimento-logs?${params.toString()}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    return (Array.isArray(items) ? items : []).map((it, i) => ({
      id: i + '-' + (it.at || 0),
      at: it.at ? new Date(it.at).toLocaleString() : '—',
      pergunta: it.pergunta || '—',
      resposta: it.resposta || '—',
      fonte: it.fonte || '—',
      tipo: it.tipo || '—',
    }));
  }, [items]);

  return (
    <>
      <Head><title>Velotax • Logs de Atendimento</title></Head>
      <Navbar />
      <div className="min-h-screen container-pad py-10">
        <div className="max-w-6xl mx-auto animate-fadeUp">
          <div className="mb-6 card p-4">
            <div className="section-title">Logs de Atendimento</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
              <div>
                <label className="block text-sm mb-1">Buscar (pergunta, resposta, fonte)</label>
                <input value={q} onChange={(e)=>setQ(e.target.value)} className="input" placeholder="Termo" />
              </div>
              <div>
                <label className="block text-sm mb-1">De</label>
                <input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Até</label>
                <input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="input" />
              </div>
              <div className="md:flex md:items-end">
                <button type="button" onClick={load} disabled={loading} className="btn-primary px-3 py-2">
                  {loading ? 'Atualizando…' : 'Atualizar'}
                </button>
              </div>
            </div>
            <div className="mt-3">
              <a href={`/api/atendimento-logs?format=csv${q||dateFrom||dateTo?`&q=${encodeURIComponent(q)}&from=${encodeURIComponent(dateFrom)}&to=${encodeURIComponent(dateTo)}`:''}`} target="_blank" rel="noopener" className="text-sm px-3 py-2 rounded border hover:opacity-90 inline-block">Exportar CSV</a>
            </div>
          </div>

          <div className="card p-4">
            <div className="section-title">Registros</div>
            {loading && <div className="text-sm text-black/60">Carregando…</div>}
            {!loading && rows.length === 0 && <div className="text-sm text-black/60">Nenhum registro.</div>}
            <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
              {rows.map((r) => (
                <div key={r.id} className="p-3 bg-white rounded border border-black/10">
                  <div className="text-xs text-black/60">{r.at} • {r.tipo} • {r.fonte}</div>
                  <div className="text-sm mt-1"><span className="font-medium">Pergunta:</span> {r.pergunta}</div>
                  <div className="text-sm mt-1 whitespace-pre-wrap"><span className="font-medium">Resposta:</span> {r.resposta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
