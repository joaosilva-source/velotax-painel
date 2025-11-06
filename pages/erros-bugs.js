// pages/erros-bugs.js
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function ErrosBugs() {
  const [agente, setAgente] = useState('');
  const [cpf, setCpf] = useState('');
  const [tipo, setTipo] = useState('App');
  const [descricao, setDescricao] = useState('');
  const [imagens, setImagens] = useState([]); // [{ name, type, data }]
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [localLogs, setLocalLogs] = useState([]); // {cpf, tipo, waMessageId, status, createdAt}
  const [searchCpf, setSearchCpf] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // cache helpers
  useEffect(() => {
    try {
      const cached = localStorage.getItem('velotax_local_logs_bugs');
      if (cached) setLocalLogs(JSON.parse(cached));
    } catch {}
  }, []);
  const saveCache = (items) => {
    setLocalLogs(items);
    try { localStorage.setItem('velotax_local_logs_bugs', JSON.stringify(items)); } catch {}
  };

  // util para gerar thumbnail (~400px)
  const makeThumb = (dataUrl) => new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const maxW = 400; const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale); const h = Math.round(img.height * scale);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch { resolve(null); }
  });

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

  const refreshNow = async () => {
    if (!localLogs.length) return;
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) return;
      const all = await res.json();
      const updated = localLogs.map(item => {
        const match = item.waMessageId
          ? all.find(r => r.waMessageId === item.waMessageId)
          : all.find(r => r.cpf === item.cpf && String(r.tipo||'').startsWith('Erro/Bug'));
        return match ? { ...item, status: match.status } : item;
      });
      saveCache(updated);
    } catch {}
  };
  useEffect(() => {
    const tick = async () => { await refreshNow(); };
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [localLogs.length]);

  const montarLegenda = () => {
    let m = `*Novo Erro/Bug - ${tipo}*\n\n`;
    m += `Agente: ${agente}\n`;
    if (cpf) m += `CPF: ${cpf}\n`;
    m += `\nDescrição:\n${descricao || '—'}\n`;
    if (imagens?.length) m += `\n[Anexos: ${imagens.length} imagem(ns)]\n`;
    return m;
  };

  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const defaultJid = process.env.NEXT_PUBLIC_DEFAULT_JID;

    const legenda = montarLegenda();

    try {
      // 1) Enviar via WhatsApp se configurado
      let waMessageId = null;
      let messageIdsArr = [];
      if (apiUrl && defaultJid) {
        const resp = await fetch(`${apiUrl}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jid: defaultJid,
            mensagem: montarLegenda(),
            imagens
          })
        });
        const d = await resp.json().catch(() => ({}));
        waMessageId = d?.messageId || d?.key?.id || null;
        if (Array.isArray(d?.messageIds)) messageIdsArr = d.messageIds;
      }

      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agente,
          cpf,
          tipo: `Erro/Bug - ${tipo}`,
          payload: { agente, cpf, tipo, descricao, imagens: imagens?.map(({ name, type, data, preview }) => ({ name, type, size: (data||'').length })), previews: imagens?.map(({ preview }) => preview).filter(Boolean), messageIds: messageIdsArr },
          agentContact: defaultJid || null,
          waMessageId
        })
      });

      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_request', detail: { tipo: `Erro/Bug - ${tipo}`, cpf, waMessageId, whatsappSent: !!(apiUrl && defaultJid) } })
      });

      // add to local logs cache
      const newItem = {
        cpf,
        tipo: `Erro/Bug - ${tipo}`,
        waMessageId,
        status: 'em aberto',
        createdAt: new Date().toISOString()
      };
      saveCache([newItem, ...localLogs].slice(0, 50));

      setMsg(apiUrl && defaultJid ? 'Enviado e registrado com sucesso.' : 'Registrado no painel. WhatsApp não configurado.');
      setAgente(''); setCpf(''); setDescricao(''); setImagens([]);
    } catch (err) {
      setMsg('Falha ao enviar/registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Velotax • Erros/Bugs</title>
      </Head>

      <div className="min-h-screen container-pad py-10">
        <div className="max-w-3xl mx-auto animate-fadeUp">
          <div className="mb-6 surface p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/brand/velotax-symbol.png" alt="Velotax" className="h-10 md:h-12 w-auto" />
              <div>
                <h1 className="titulo-principal mb-1">Erros / Bugs</h1>
                <p className="text-white/80">Reporte problemas com anexos de imagem para o time</p>
              </div>
            </div>
            <a href="/" className="px-3 py-2 rounded bg-black/10 hover:bg-black/20 text-sm">← Voltar para a Home</a>
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
                      <div className="font-medium flex items-center gap-2">
                        <span>{r.tipo} — {r.cpf}</span>
                        {(() => {
                          const count = Array.isArray(r?.payload?.previews) ? r.payload.previews.length : (Array.isArray(r?.payload?.imagens) ? r.payload.imagens.length : 0);
                          return count > 0 ? (<span className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-xs">Anexos: {count}</span>) : null;
                        })()}
                      </div>
                      <div className="text-xs text-black/60">Agente: {r.agente || '—'} • Status: {r.status || '—'}</div>
                    </div>
                    <div className="text-xs text-black/60">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={enviar} className="card p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-black/80">Agente</label>
                <input className="input" value={agente} onChange={(e) => setAgente(e.target.value)} required placeholder="Nome do agente" />
              </div>
              <div>
                <label className="text-sm text-black/80">CPF (opcional)</label>
                <input className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
            </div>

            <div>
              <label className="text-sm text-black/80">Tipo</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option>App</option>
                <option>Crédito Pessoal</option>
                <option>Crédito do Trabalhador</option>
                <option>Antecipação</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-black/80">Descrição</label>
              <textarea
                className="input h-32"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Explique o problema, passos para reproduzir, telas envolvidas...\n(Dica: você pode colar imagens aqui)"
                onPaste={async (e) => {
                  const items = Array.from(e.clipboardData?.items || []);
                  const imgs = items.filter(it => it.type && it.type.startsWith('image/'));
                  if (!imgs.length) return;
                  e.preventDefault();
                  const arr = [...imagens];
                  for (const it of imgs) {
                    try {
                      const file = it.getAsFile();
                      if (!file) continue;
                      const dataUrl = await new Promise((ok, err) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = err; r.readAsDataURL(file); });
                      const base64 = String(dataUrl).split(',')[1];
                      const preview = await makeThumb(String(dataUrl));
                      arr.push({ name: file.name || 'clipboard.png', type: file.type || 'image/png', data: base64, preview });
                    } catch {}
                  }
                  setImagens(arr);
                }}
              />
            </div>

            <div>
              <label className="text-sm text-black/80">Anexos (imagens)</label>
              <div className="mt-1 p-4 border-2 border-dashed rounded-lg text-center bg-white hover:bg-black/5">
                <div className="mb-2 text-black/70">Arraste e solte aqui, clique para selecionar ou cole imagens no campo de descrição</div>
                <label className="inline-block px-3 py-2 rounded bg-sky-600 text-white cursor-pointer hover:bg-sky-700">
                  Selecionar imagens
                  <input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const arr = [];
                const makeThumb = (dataUrl) => new Promise((resolve) => {
                  const img = new Image();
                  img.onload = () => {
                    const maxW = 400; const scale = Math.min(1, maxW / img.width);
                    const w = Math.round(img.width * scale); const h = Math.round(img.height * scale);
                    const c = document.createElement('canvas'); c.width = w; c.height = h;
                    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
                    resolve(c.toDataURL('image/jpeg', 0.8));
                  };
                  img.onerror = () => resolve(null);
                  img.src = dataUrl;
                });
                for (const f of files) {
                  try {
                    const dataUrl = await new Promise((ok, err) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = err; r.readAsDataURL(f); });
                    const base64 = String(dataUrl).split(',')[1];
                    const preview = await makeThumb(String(dataUrl));
                    arr.push({ name: f.name, type: f.type || 'image/jpeg', data: base64, preview });
                  } catch {}
                }
                setImagens(prev => [...prev, ...arr]);
              }} className="hidden" />
                </label>
              </div>
              {imagens && imagens.length > 0 && (
                <>
                  <div className="text-xs text-black/60 mt-2">{imagens.length} imagem(ns) anexada(s)</div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {imagens.map((im, idx) => (
                      <img key={idx} src={im.preview ? im.preview : (im.data ? `data:${im.type||'image/jpeg'};base64,${im.data}` : '')} alt={`anexo-${idx}`} className="h-16 w-auto rounded border" />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button type="submit" disabled={loading} className={`btn-primary ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>{loading ? 'Enviando...' : 'Enviar'}</button>
              {msg && <span className="text-sm text-black/70">{msg}</span>}
            </div>
          </form>

          {/* Logs de Envio */}
          <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-black/10 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-emerald-500" />
              <h2 className="text-lg font-semibold">Logs de Envio</h2>
              <button type="button" onClick={refreshNow} className="ml-auto text-sm px-2 py-1 rounded bg-black/5 hover:bg-black/10">Atualizar agora</button>
            </div>
            <div className="max-h-72 overflow-auto pr-1">
            {(!localLogs || localLogs.length === 0) && (
              <div className="text-black/60">Nenhum log ainda.</div>
            )}
            <div className="space-y-2">
              {localLogs.map((l, idx) => {
                const icon = l.status === 'feito' ? '✅' : (l.status === 'não feito' ? '❌' : '⏳');
                return (
                  <div key={idx} className="p-3 bg-white rounded border border-black/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm">{l.cpf || '—'} — {l.tipo}</span>
                    </div>
                    <div className="text-xs text-black/60">{new Date(l.createdAt).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
