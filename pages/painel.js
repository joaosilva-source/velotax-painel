// pages/painel.js
// pages/painel.js - Painel de Solicitações (migrado da home antiga)
import { useEffect, useRef, useState } from "react";
import FormSolicitacao from "@/components/FormSolicitacao";
import Head from "next/head";

export default function Painel() {
  const [logs, setLogs] = useState([]);
  const [searchCpf, setSearchCpf] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchCpfError, setSearchCpfError] = useState('');
  const [stats, setStats] = useState({ today: 0, pending: 0, done: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [requestsRaw, setRequestsRaw] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [agentHistory, setAgentHistory] = useState([]);
  const [agentHistoryLoading, setAgentHistoryLoading] = useState(false);
  const [agentHistoryLimit, setAgentHistoryLimit] = useState(50);
  const prevRequestsRef = useRef([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState('https://whatsapp-api-y40p.onrender.com');
  const [replies, setReplies] = useState([]);
  const [myAgent, setMyAgent] = useState('');
  const norm = (s='') => String(s).toLowerCase().trim().replace(/\s+/g,' ');

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
      setLastUpdated(new Date());
      try {
        const agent = localStorage.getItem('velotax_agent');
        if (agent) setSelectedAgent(agent);
      } catch {}
    } catch {}
    setStatsLoading(false);
  };

  useEffect(() => {
    try { if (typeof window !== 'undefined' && 'Notification' in window) Notification.requestPermission().catch(()=>{}); } catch {}
    loadStats();
    const id = setInterval(loadStats, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const a = localStorage.getItem('velotax_agent') || '';
      setMyAgent(a);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      setBackendUrl((v) => (v ? v.replace(/\/$/, '') : 'https://whatsapp-api-y40p.onrender.com'));
    } catch {}
  }, []);

  useEffect(() => {
    if (!backendUrl) return;
    let es;
    try {
      const q = myAgent ? `?agent=${encodeURIComponent(myAgent)}` : '';
      es = new EventSource(`${backendUrl}/stream/replies${q}`);
      es.addEventListener('init', (e) => {
        try {
          const arr = JSON.parse(e.data || '[]');
          if (Array.isArray(arr)) setReplies(arr.slice(-50).reverse());
        } catch {}
      });
      es.addEventListener('reply', (e) => {
        try {
          const ev = JSON.parse(e.data || '{}');
          const extractCpf = (s='') => {
            try {
              const m = String(s).match(/CPF\s*:\s*([^\n]+)/i);
              if (m && m[1]) {
                const dig = String(m[1]).replace(/\D/g, '');
                return dig || null;
              }
            } catch {}
            return null;
          };
          const displayCpf = ev.cpf || extractCpf(ev.text || '') || '—';
          setReplies((prev) => [{
            at: ev.at,
            cpf: displayCpf,
            solicitacao: ev.solicitacao || '—',
            reactor: ev.reactor || '—',
            waMessageId: ev.waMessageId || '',
            text: ev.text || '',
            agente: ev.agente || ''
          }, ...prev].slice(0, 50));
        } catch {}
      });
    } catch {}
    return () => { try { es && es.close(); } catch {} };
  }, [backendUrl, myAgent]);

  useEffect(() => {
    const arr = Array.isArray(requestsRaw) ? requestsRaw : [];
    const base = selectedAgent ? arr.filter((r) => norm(r?.agente||'') === norm(selectedAgent)) : arr;
    const todayStr = new Date().toDateString();
    const today = base.filter((r) => new Date(r?.createdAt || 0).toDateString() === todayStr).length;
    const done = base.filter((r) => String(r?.status || '').toLowerCase() === 'feito').length;
    const pending = base.length - done;
    setStats({ today, pending, done });

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

  useEffect(() => {
    const load = async () => {
      if (!selectedAgent) { setAgentHistory([]); return; }
      setAgentHistoryLoading(true);
      try {
        const res = await fetch('/api/requests');
        if (!res.ok) throw new Error('fail');
        const list = await res.json();
        const arr = Array.isArray(list) ? list : [];
        const filtered = arr.filter((r) => norm(r?.agente||'') === norm(selectedAgent))
          .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAgentHistory(filtered);
      } catch {
        setAgentHistory([]);
      }
      setAgentHistoryLoading(false);
    };
    load();
    setAgentHistoryLimit(100);
  }, [selectedAgent]);

  const buscarCpf = async () => {
    const digits = String(searchCpf || "").replace(/\D/g, "");
    if (!digits) {
      setSearchResults([]);
      setSearchCpfError('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    if (digits.length !== 11) {
      setSearchResults([]);
      setSearchCpfError('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    setSearchCpfError('');
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
          <div className="mb-8 surface p-8 flex flex-col items-center text-center gap-4">
            <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-12 md:h-14 w-auto" />
            <h1 className="titulo-principal">Painel de Solicitações</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3 card hover:-translate-y-0.5 p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="grid grid-cols-3 gap-3 w-full max-w-xl" aria-busy={statsLoading} aria-live="polite">
                  <div className="surface p-3 rounded-xl text-center">
                    <div className="text-xs text-black/60">Hoje</div>
                    <div className="text-2xl font-semibold">
                      {statsLoading ? <span className="inline-block h-6 w-16 bg-black/10 rounded animate-pulse" /> : stats.today}
                    </div>
                  </div>
                  <div className="surface p-3 rounded-xl text-center">
                    <div className="text-xs text-black/60">Pendentes</div>
                    <div className="text-2xl font-semibold">
                      {statsLoading ? <span className="inline-block h-6 w-16 bg-black/10 rounded animate-pulse" /> : stats.pending}
                    </div>
                  </div>
                  <div className="surface p-3 rounded-xl text-center">
                    <div className="text-xs text-black/60">Feitas</div>
                    <div className="text-2xl font-semibold">
                      {statsLoading ? <span className="inline-block h-6 w-16 bg-black/10 rounded animate-pulse" /> : stats.done}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-end gap-2">
                    <div className="text-xs text-black/60">Meu nome de agente</div>
                    <input
                      value={selectedAgent}
                      onChange={(e)=>{
                        const v = e.target.value;
                        setSelectedAgent(v);
                        setMyAgent(v);
                        try { localStorage.setItem('velotax_agent', v); } catch {}
                      }}
                      placeholder="Ex.: Vanessa"
                      className="border rounded px-2 py-1 text-xs"
                      style={{minWidth:140}}
                    />
                  </div>
                  <button onClick={loadStats} disabled={statsLoading} className="text-sm px-3 py-2 rounded border hover:opacity-90 inline-flex items-center gap-2 transition-all duration-200">
                    {statsLoading ? (
                      <svg width="16" height="16" viewBox="0 0 50 50" role="img" aria-label="Carregando" style={{ display: 'block' }}>
                        <circle cx="25" cy="25" r="20" stroke="#94a3b8" strokeWidth="6" fill="none" opacity="0.25" />
                        <path d="M25 5 a20 20 0 0 1 0 40" stroke="#0ea5e9" strokeWidth="6" fill="none">
                          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" />
                        </path>
                      </svg>
                    ) : 'Atualizar agora'}
                  </button>
                  <div className="text-[11px] text-black/60 min-w-[120px] text-right">
                    {lastUpdated ? `Atualizado às ${new Date(lastUpdated).toLocaleTimeString()}` : ''}
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
                  <h2 className="text-lg font-semibold">Consulta de CPF</h2>
                </div>
                <div className="flex flex-col md:flex-row gap-2 md:items-end" aria-busy={searchLoading} aria-live="polite">
                  <div className="flex-1">
                    <label className="text-sm text-black/80">CPF</label>
                    <input
                      className="input"
                      placeholder="Digite o CPF"
                      value={searchCpf}
                      onChange={(e) => { setSearchCpf(e.target.value); if (searchCpfError) setSearchCpfError(''); }}
                      onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); buscarCpf(); } }}
                    />
                    {searchCpfError && (
                      <div className="mt-1 text-xs text-red-600">{searchCpfError}</div>
                    )}
                  </div>
                  <button type="button" onClick={buscarCpf} className="btn-primary px-3 py-2 inline-flex items-center gap-2 transition-all duration-200" disabled={searchLoading}>
                    {searchLoading ? (<><img src="/brand/loading.gif" alt="Carregando" style={{ width: 16, height: 16 }} /> Buscando...</>) : 'Buscar'}
                  </button>
                </div>
                {searchCpf && (
                  <div className="text-sm text-black/60 mt-2">{searchResults.length} registro(s) encontrado(s)</div>
                )}
                {searchLoading && (
                  <div className="space-y-2 mt-3 max-h-64">
                    {[...Array(4)].map((_,i) => (
                      <div key={i} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between animate-pulse">
                        <div>
                          <div className="h-4 w-40 bg-black/10 rounded mb-1" />
                          <div className="h-3 w-32 bg-black/10 rounded" />
                        </div>
                        <div className="h-3 w-24 bg-black/10 rounded" />
                      </div>
                    ))}
                  </div>
                )}
                {searchResults && searchResults.length > 0 && !searchLoading && (
                  <div className="space-y-2 mt-3 max-h-64 overflow-auto">
                    {searchResults.slice(0,8).map((r) => {
                      const imgCount = Array.isArray(r?.payload?.previews) ? r.payload.previews.length : (Array.isArray(r?.payload?.imagens) ? r.payload.imagens.length : 0);
                      const videoCount = Array.isArray(r?.payload?.videos) ? r.payload.videos.length : 0;
                      const total = imgCount + videoCount;
                      return (
                        <div key={r.id} className="p-3 bg-white rounded border border-black/10">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                <span>{r.tipo} — {r.cpf}</span>
                                {total > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-xs">
                                    Anexos: {imgCount > 0 ? `${imgCount} img` : ''}{imgCount > 0 && videoCount > 0 ? ' + ' : ''}{videoCount > 0 ? `${videoCount} vid` : ''}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-black/60">Agente: {r.agente || '—'} • Status: {r.status || '—'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-black/60">{new Date(r.createdAt).toLocaleString()}</div>
                              {total > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Criar modal similar ao da página de erros/bugs
                                    const modal = document.createElement('div');
                                    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50';
                                    modal.innerHTML = `
                                      <div class="bg-white rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
                                        <div class="p-4 border-b border-black/10 flex items-center justify-between">
                                          <h3 class="text-lg font-semibold">Anexos - ${r.tipo}</h3>
                                          <button type="button" class="text-black/60 hover:text-black text-2xl leading-none" onclick="this.closest('.fixed').remove()">×</button>
                                        </div>
                                        <div class="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                                          <div class="space-y-4">
                                            <div class="bg-black/5 p-3 rounded-lg">
                                              <div class="text-sm space-y-1">
                                                <div><strong>CPF:</strong> ${r.cpf || '—'}</div>
                                                <div><strong>Agente:</strong> ${r.agente || '—'}</div>
                                                <div><strong>Status:</strong> ${r.status || '—'}</div>
                                                <div><strong>Descrição:</strong> ${r.payload?.descricao || '—'}</div>
                                              </div>
                                            </div>
                                            ${r.payload?.previews?.length > 0 ? `
                                              <div>
                                                <h4 class="font-medium mb-2">Imagens (${r.payload.previews.length})</h4>
                                                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                  ${r.payload.previews.map((preview, idx) => `
                                                    <div class="relative group">
                                                      <img src="${preview}" alt="imagem-${idx}" class="w-full h-32 object-cover rounded-lg border" style="cursor: pointer" onclick="window.open('${preview}', '_blank')" />
                                                      <button type="button" onclick="window.open('${preview}', '_blank')" class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Abrir</button>
                                                    </div>
                                                  `).join('')}
                                                </div>
                                              </div>
                                            ` : ''}
                                            ${r.payload?.videos?.length > 0 ? `
                                              <div>
                                                <h4 class="font-medium mb-2">Vídeos (${r.payload.videos.length})</h4>
                                                <div class="space-y-2">
                                                  ${r.payload.videos.map((video, idx) => `
                                                    <div class="flex items-center gap-3 p-3 bg-black/5 rounded-lg">
                                                      <div class="relative">
                                                        ${r.payload.videoThumbnails?.[idx] ? `
                                                          <img src="${r.payload.videoThumbnails[idx]}" alt="video-thumb-${idx}" class="w-20 h-14 object-cover rounded border" />
                                                          <div class="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                                                            <span class="text-white text-xs">▶</span>
                                                          </div>
                                                        ` : ''}
                                                      </div>
                                                      <div class="flex-1">
                                                        <div class="text-sm font-medium">${video.name}</div>
                                                        <div class="text-xs text-black/60">${video.type} • ${Math.round(video.size / 1024 / 1024 * 100) / 100} MB</div>
                                                      </div>
                                                      <div class="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">Vídeo não disponível</div>
                                                    </div>
                                                  `).join('')}
                                                </div>
                                              </div>
                                            ` : ''}
                                            ${!r.payload?.previews?.length && !r.payload?.videos?.length ? '<div class="text-center text-black/60 py-8">Nenhum anexo disponível para esta solicitação.</div>' : ''}
                                          </div>
                                        </div>
                                      </div>
                                    `;
                                    document.body.appendChild(modal);
                                  }}
                                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                >
                                  Ver anexos
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                  {agentHistoryLoading && (
                    <div className="space-y-2" aria-busy={true} aria-live="polite">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between animate-pulse">
                          <div>
                            <div className="h-4 w-48 bg-black/10 rounded mb-1" />
                            <div className="h-3 w-24 bg-black/10 rounded" />
                          </div>
                          <div className="h-3 w-28 bg-black/10 rounded" />
                        </div>
                      ))}
                    </div>
                  )}
                  {!agentHistoryLoading && agentHistory.length === 0 && (
                    <div className="text-sm opacity-70">Nenhum registro.</div>
                  )}
                  <div className="space-y-2 max-h-72 overflow-auto pr-1 mt-2">
                    {agentHistory.slice(0, agentHistoryLimit).map((r) => {
                      const s = String(r.status || '').toLowerCase();
                      const badge = s === 'feito' ? 'bg-emerald-100 text-emerald-700' : ((s === 'não feito' || s === 'nao feito') ? 'bg-red-100 text-red-700' : (s === 'enviado' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'));
                      const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : '—';
                      const concluded = (s === 'feito' || s === 'não feito' || s === 'nao feito') && r.updatedAt ? new Date(r.updatedAt).toLocaleString() : null;
                      return (
                        <div key={r.id} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                          <div>
                            <div className="font-medium">{r.tipo} — {r.cpf}</div>
                            <div className="text-xs text-black/60 flex items-center gap-2">
                              <span>Status:</span>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${badge}`}>{s || '—'}</span>
                            </div>
                            <div className="text-[11px] text-black/60 mt-1">
                              <span>Aberto em: {created}</span>
                              {concluded && <span className="ml-2">• Concluído em: {concluded}</span>}
                            </div>
                          </div>
                          <div className="text-xs text-black/60">{created}</div>
                        </div>
                      );
                    })}
                  </div>
                  {agentHistory.length > agentHistoryLimit && (
                    <div className="mt-3 text-right">
                      <button type="button" onClick={() => setAgentHistoryLimit((n) => n + 50)} className="text-sm px-3 py-1 rounded border hover:opacity-90 transition-all duration-200">
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
      </div>
    </>
  );
}

