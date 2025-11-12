// pages/index.js
import { useEffect, useRef, useState } from "react";
import FormSolicitacao from "@/components/FormSolicitacao";
// Logs removidos da lateral para reduzir poluição visual
import Head from "next/head";

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [searchCpf, setSearchCpf] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState({ today: 0, pending: 0, done: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [requestsRaw, setRequestsRaw] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [agentHistory, setAgentHistory] = useState([]);
  const [agentHistoryLoading, setAgentHistoryLoading] = useState(false);
  const [agentHistoryLimit, setAgentHistoryLimit] = useState(50);
  const prevRequestsRef = useRef([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [replies, setReplies] = useState([]);

  const registrarLog = (msg) => {
    setLogs((prev) => [{ msg, time: new Date().toLocaleString("pt-BR") }, ...prev]);
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('fail');
      const list = await res.json();
      const arr = Array.isArray(list) ? list : [];
      setRequestsRaw(arr);
      // pegar agente do cache local do usuário
      try {
        const agent = localStorage.getItem('velotax_agent');
        if (agent) setSelectedAgent(agent);
      } catch {}
    } catch {
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    // pedir permissão de notificação
    try { if (typeof window !== 'undefined' && 'Notification' in window) Notification.requestPermission().catch(()=>{}); } catch {}
    loadStats();
    const id = setInterval(loadStats, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const fromEnv = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const fromStore = typeof window !== 'undefined' ? (localStorage.getItem('velotax_backend') || '') : '';
      const url = String(fromEnv || fromStore || '').trim();
      if (url) setBackendUrl(url.replace(/\/$/, ''));
    } catch {}
  }, []);

  useEffect(() => {
    if (!backendUrl) return;
    let es;
    try {
      es = new EventSource(`${backendUrl}/stream/replies`);
      es.addEventListener('init', (e) => {
        try {
          const arr = JSON.parse(e.data || '[]');
          if (Array.isArray(arr)) setReplies(arr.slice(-50).reverse());
        } catch {}
      });
      es.addEventListener('reply', (e) => {
        try {
          const ev = JSON.parse(e.data || '{}');
          setReplies((prev) => [{
            at: ev.at,
            cpf: ev.cpf || '—',
            solicitacao: ev.solicitacao || '—',
            reactor: ev.reactor || '—',
            waMessageId: ev.waMessageId || ''
          }, ...prev].slice(0, 50));
        } catch {}
      });
    } catch {}
    return () => { try { es && es.close(); } catch {} };
  }, [backendUrl]);

  useEffect(() => {
    const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
    const base = selectedAgent ? arr.filter((r) => String(r?.agente||'') === selectedAgent) : arr;
    const todayStr = new Date().toDateString();
    const today = base.filter((r) => new Date(r?.createdAt || 0).toDateString() === todayStr).length;
    const done = base.filter((r) => String(r?.status || '').toLowerCase() === 'feito').length;
    const pending = base.length - done;
    setStats({ today, pending, done });

    // notificar mudanças de status 'feito' ou 'não feito'
    try {
      const prev = Array.isArray(prevRequestsRef.current) ? prevRequestsRef.current : [];
      const mapPrev = new Map(prev.map((r) => [r.id, String(r.status || '')]));
      const changed = base.filter((r) => {
        const prevSt = mapPrev.get(r.id);
        const curSt = String(r.status || '').toLowerCase();
        if (!prevSt) return false;
        return prevSt.toLowerCase() !== curSt && (curSt === 'feito' || curSt === 'não feito');
      });
      if (changed.length) {
        const play = async () => {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
            o.start();
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            o.stop(ctx.currentTime + 0.4);
          } catch {}
        };
        const notify = (title, body) => {
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, { body });
            }
          } catch {}
        };
        changed.forEach((r) => {
          const st = String(r.status || '').toLowerCase();
          notify(st === 'feito' ? 'Solicitação concluída' : 'Solicitação marcada como não feita', `${r.tipo} — ${r.cpf}`);
        });
        play();
      }
      prevRequestsRef.current = base.map((r) => ({ id: r.id, status: r.status }));
    } catch {}
  }, [requestsRaw, selectedAgent]);

  // carregar histórico completo do agente (exibe no painel direito)
  useEffect(() => {
    const load = async () => {
      if (!selectedAgent) { setAgentHistory([]); return; }
      setAgentHistoryLoading(true);
      try {
        const res = await fetch('/api/requests');
        if (!res.ok) throw new Error('fail');
        const list = await res.json();
        const arr = Array.isArray(list) ? list : [];
        const filtered = arr.filter((r) => String(r?.agente||'') === selectedAgent)
          .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAgentHistory(filtered);
      } catch {
        setAgentHistory([]);
      }
      setAgentHistoryLoading(false);
    };
    load();
    setAgentHistoryLimit(50);
  }, [selectedAgent]);

  const buscarCpf = async () => {
    const digits = String(searchCpf || "").replace(/\D/g, "");
    if (!digits) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) return;
      const list = await res.json();
      const filtered = Array.isArray(list)
        ? list.filter((r) => String(r?.cpf || '').replace(/\D/g, '').includes(digits))
        : [];
      setSearchResults(filtered);
    } catch {}
    setSearchLoading(false);
  };

  return (
    <>
      <Head>
        <title>Velotax • Painel de Solicitações</title>
      </Head>

      <div className="min-h-screen container-pad py-10">
        <div className="max-w-6xl mx-auto animate-fadeUp">
          {/* HERO */}
          <div className="mb-8 surface p-8 flex flex-col items-center text-center gap-4">
            <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-12 md:h-14 w-auto" />
            <h1 className="titulo-principal">Painel de Solicitações</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3 card hover:-translate-y-0.5 p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="grid grid-cols-3 gap-3 w-full max-w-xl">
                  <div className="surface p-3 rounded-xl text-center">
                    <div className="text-xs text-black/60">Hoje</div>
                    <div className="text-2xl font-semibold">{stats.today}</div>
                  </div>
                  <div className="surface p-3 rounded-xl text-center">
                    <div className="text-xs text-black/60">Pendentes</div>
                    <div className="text-2xl font-semibold">{stats.pending}</div>
                  </div>
                  <div className="surface p-3 rounded-xl text-center">
                    <div className="text-xs text-black/60">Feitas</div>
                    <div className="text-2xl font-semibold">{stats.done}</div>
                  </div>
                </div>
                <button onClick={loadStats} disabled={statsLoading} className="text-sm px-3 py-2 rounded border hover:opacity-90">
                  {statsLoading ? 'Atualizando…' : 'Atualizar agora'}
                </button>
              </div>
              <div className="mb-6 bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
                  <h2 className="text-lg font-semibold">Consulta de CPF</h2>
                </div>
                <div className="flex flex-col md:flex-row gap-2 md:items-end">
                  <div className="flex-1">
                    <label className="text-sm text-black/80">CPF</label>
                    <input className="input" placeholder="Digite o CPF" value={searchCpf} onChange={(e) => setSearchCpf(e.target.value)} />
                  </div>
                  <button type="button" onClick={buscarCpf} className="btn-primary px-3 py-2" disabled={searchLoading}>{searchLoading ? 'Buscando...' : 'Buscar'}</button>
                </div>
                {searchCpf && (
                  <div className="text-sm text-black/60 mt-2">{searchResults.length} registro(s) encontrado(s)</div>
                )}
                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2 mt-3 max-h-64 overflow-auto">
                    {searchResults.slice(0,8).map((r) => (
                      <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{r.tipo} — {r.cpf}</div>
                          <div className="text-xs text-black/60">Agente: {r.agente || '—'} • Status: {r.status || '—'}</div>
                        </div>
                        <div className="text-xs text-black/60">{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="section-title">Formulário de Solicitação</div>
              <FormSolicitacao registrarLog={registrarLog} />
            </div>
            <div className="lg:col-span-3 card hover:-translate-y-0.5 p-4">
              <button type="button" onClick={() => setHistoryOpen((v)=>!v)} className="w-full text-left">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
                  <h2 className="text-lg font-semibold">Histórico do agente</h2>
                  <span className="ml-auto text-sm opacity-70">{selectedAgent || '—'}</span>
                  <span className="text-sm opacity-70 ml-2">{historyOpen ? 'Recolher' : 'Expandir'}</span>
                </div>
              </button>
              {historyOpen && (
                <div className="mt-3">
                  {agentHistoryLoading && <div className="text-sm opacity-70">Carregando…</div>}
                  {!agentHistoryLoading && agentHistory.length === 0 && (
                    <div className="text-sm opacity-70">Nenhum registro.</div>
                  )}
                  <div className="space-y-2 max-h-72 overflow-auto pr-1 mt-2">
                    {agentHistory.slice(0, agentHistoryLimit).map((r) => (
                      <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{r.tipo} — {r.cpf}</div>
                          <div className="text-xs text-black/60">Status: {r.status || '—'}</div>
                        </div>
                        <div className="text-xs text-black/60">{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  {agentHistory.length > agentHistoryLimit && (
                    <div className="mt-3 text-right">
                      <button type="button" onClick={() => setAgentHistoryLimit((n) => n + 50)} className="text-sm px-3 py-1 rounded border hover:opacity-90">
                        Carregar mais ({agentHistory.length - agentHistoryLimit} restantes)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <a href="/erros-bugs" className="block card hover:-translate-y-0.5 p-4 text-center">
              <div className="text-lg font-semibold mb-1">Erros / Bugs</div>
              <div className="text-black/70">Reportar problemas com anexos de imagem</div>
            </a>
            <a href="/restituicao" className="block card hover:-translate-y-0.5 p-4 text-center">
              <div className="text-lg font-semibold mb-1">Cálculo de Restituição</div>
              <div className="text-black/70">1º base • 2º +1% • 3º +1,79%</div>
            </a>
            <a href="/seguro_celular_velotax.html" className="block card hover:-translate-y-0.5 p-4 text-center">
              <div className="text-lg font-semibold mb-1">Seguro Celular</div>
              <div className="text-black/70">Material de atendimento com guia completo</div>
            </a>
            <div className="lg:col-span-3 mt-2 flex flex-wrap items-center gap-2">
              <a href="/credito_trabalhador_velotax.html" className="btn-primary px-3 py-2 text-sm">Crédito do Trabalhador</a>
              <a href="/credito_pessoal_velotax.html" className="btn-primary px-3 py-2 text-sm">Crédito Pessoal</a>
            </div>
          </div>
        </div>
        <div className="fixed right-4 top-24 w-80 max-w-[90vw] bg-white border border-black/10 rounded-xl shadow-lg p-3 z-40">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
            <div className="text-sm font-semibold">Respostas (tempo real)</div>
            <button type="button" onClick={() => {
              try {
                const v = prompt('Backend URL (ex.: https://seu-servico.onrender.com)', backendUrl || '');
                if (v !== null) {
                  const val = String(v).trim().replace(/\/$/, '');
                  setBackendUrl(val);
                  if (typeof window !== 'undefined') localStorage.setItem('velotax_backend', val);
                }
              } catch {}
            }} className="ml-auto text-xs px-2 py-1 rounded border">{backendUrl ? 'Configurar' : 'Definir URL'}</button>
          </div>
          {!backendUrl && (
            <div className="text-xs text-black/60">Defina o Backend URL para ativar o stream.</div>
          )}
          {backendUrl && replies.length === 0 && (
            <div className="text-xs text-black/60">Aguardando respostas…</div>
          )}
          {backendUrl && replies.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-auto pr-1">
              {replies.map((r, idx) => (
                <div key={(r.waMessageId||'')+idx} className="p-2 bg-white rounded border border-black/10">
                  <div className="text-sm font-medium">{r.solicitacao || '—'}</div>
                  <div className="text-xs text-black/70">CPF: {r.cpf || '—'}</div>
                  <div className="text-[11px] opacity-60 mt-1">{new Date(r.at || Date.now()).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}